import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database/config'

export async function GET(request: NextRequest) {
  console.log('=== DASHBOARD API START ===')
  
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')
    
    // Validasi headers
    if (!userId || !userRole) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Unauthorized: Missing user headers',
          cardboard: {
            hk: 0, hke: 0, hkne: 0, totalDp: 0, totalTerkirim: 0, totalGagal: 0
          },
          shipments: [],
          chartData: [],
          total: 0,
          activeFilters: {}
        },
        { status: 401 }
      )
    }

    const fromDate = searchParams.get('from')
    const toDate = searchParams.get('to')
    const search = searchParams.get('search')
    
    // PARAMETER FILTER
    const filterByMetric = searchParams.get('filterByMetric')
    const filterByDate = searchParams.get('filterByDate')
    const filterByType = searchParams.get('filterByType')
    
    // PARAMETER CHART BAR
    const chartBarClicked = searchParams.get('chartBarClicked') === 'true'
    const clickedDate = searchParams.get('clickedDate')
    const clickedType = searchParams.get('clickedType')

    console.log('Chart bar params:', { chartBarClicked, clickedDate, clickedType })

    // Prioritaskan filter dari chart bar
    const finalFilterDate = clickedDate || filterByDate
    const finalFilterType = clickedType || filterByType

    let query = `
      SELECT 
        s.*,
        u.role,
        COALESCE(s.nama_freelance, '') as nama_freelance_clean,
        s.tanggal::text as tanggal_str,
        EXTRACT(DOW FROM s.tanggal) as day_of_week
      FROM shipment s
      JOIN "user" u ON s.user_id = u.user_id
      WHERE 1=1
    `

    const queryParams: any[] = []
    let paramIndex = 1

    if (userRole === 'regular') {
      query += ` AND s.user_id = $${paramIndex}`
      queryParams.push(userId)
      paramIndex++
    }

    if (fromDate && !finalFilterDate) {
      query += ` AND s.tanggal >= $${paramIndex}`
      queryParams.push(fromDate)
      paramIndex++
    }

    if (toDate && !finalFilterDate) {
      query += ` AND s.tanggal <= $${paramIndex}`
      queryParams.push(toDate)
      paramIndex++
    }

    if (search) {
      query += ` AND (
        s.nama_lengkap ILIKE $${paramIndex} OR
        s.shipment_id::text ILIKE $${paramIndex} OR
        s.tanggal::text ILIKE $${paramIndex} OR
        COALESCE(s.nama_freelance, '') ILIKE $${paramIndex}
      )`
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    if (finalFilterDate) {
      query += ` AND s.tanggal = $${paramIndex}`
      queryParams.push(finalFilterDate)
      paramIndex++
      console.log('Filter by date:', finalFilterDate)
    }

    if (finalFilterType) {
      if (finalFilterType === 'terkirim') {
        query += ` AND s.terkirim > 0`
      } else if (finalFilterType === 'gagal') {
        query += ` AND s.gagal > 0`
      }
    }

    if (filterByMetric && !chartBarClicked) {
      switch(filterByMetric) {
        case 'hk':
          query += ` AND EXTRACT(DOW FROM s.tanggal) != 0`
          break
        case 'hke':
          query += ` AND (s.nama_freelance IS NULL OR s.nama_freelance = '' OR s.nama_freelance = '-')`
          break
        case 'hkne':
          query += ` AND s.nama_freelance IS NOT NULL AND s.nama_freelance != '' AND s.nama_freelance != '-'`
          break
        case 'dp':
          query += ` AND s.jumlah_toko > 0`
          break
      }
    }

    query += ` ORDER BY s.tanggal DESC, s.created_at DESC`

    const client = await pool.connect()

    try {
      // 1. Query shipments
      const shipmentsResult = await client.query(query, queryParams)
      
      const shipments = shipmentsResult.rows.map(row => ({
        ...row,
        shipment_id: String(row.shipment_id || ''),
        user_id: String(row.user_id || ''),
        tanggal: row.tanggal ? new Date(row.tanggal).toISOString().split('T')[0] : '',
        jumlah_toko: Number(row.jumlah_toko) || 0,
        terkirim: Number(row.terkirim) || 0,
        gagal: Number(row.gagal) || 0,
        nama_lengkap: String(row.nama_lengkap || ''),
        nama_freelance: String(row.nama_freelance || ''),
        created_at: row.created_at ? new Date(row.created_at).toISOString() : '',
        updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : '',
        role: String(row.role || ''),
        day_of_week: Number(row.day_of_week) || 0,
        is_sunday: Number(row.day_of_week) === 0
      }))

      // 2. Query metrics
      let metricsQuery = `
        SELECT 
          COUNT(DISTINCT CASE 
            WHEN EXTRACT(DOW FROM tanggal) != 0 
            THEN tanggal 
            ELSE NULL 
          END) as total_hari_kerja,
          
          COUNT(DISTINCT CASE 
            WHEN EXTRACT(DOW FROM tanggal) != 0 
              AND (nama_freelance IS NULL OR nama_freelance = '' OR nama_freelance = '-')
            THEN tanggal 
            ELSE NULL 
          END) as hke,
          
          COUNT(DISTINCT CASE 
            WHEN EXTRACT(DOW FROM tanggal) != 0 
              AND nama_freelance IS NOT NULL 
              AND nama_freelance != '' 
              AND nama_freelance != '-'
            THEN tanggal 
            ELSE NULL 
          END) as hkne,
          
          COALESCE(SUM(jumlah_toko), 0) as total_dp,
          COALESCE(SUM(terkirim), 0) as total_terkirim,
          COALESCE(SUM(gagal), 0) as total_gagal,
          COUNT(*) as total_shipments
        FROM shipment
        WHERE 1=1
      `

      const metricsParams: any[] = []
      let metricsParamIndex = 1

      if (userRole === 'regular') {
        metricsQuery += ` AND user_id = $${metricsParamIndex}`
        metricsParams.push(userId)
        metricsParamIndex++
      }

      if (fromDate && !finalFilterDate) {
        metricsQuery += ` AND tanggal >= $${metricsParamIndex}`
        metricsParams.push(fromDate)
        metricsParamIndex++
      }

      if (toDate && !finalFilterDate) {
        metricsQuery += ` AND tanggal <= $${metricsParamIndex}`
        metricsParams.push(toDate)
        metricsParamIndex++
      }

      if (search) {
        metricsQuery += ` AND (
          nama_lengkap ILIKE $${metricsParamIndex} OR
          shipment_id::text ILIKE $${metricsParamIndex} OR
          tanggal::text ILIKE $${metricsParamIndex} OR
          COALESCE(nama_freelance, '') ILIKE $${metricsParamIndex}
        )`
        metricsParams.push(`%${search}%`)
        metricsParamIndex++
      }

      if (finalFilterDate) {
        metricsQuery += ` AND tanggal = $${metricsParamIndex}`
        metricsParams.push(finalFilterDate)
        metricsParamIndex++
      }

      if (finalFilterType) {
        if (finalFilterType === 'terkirim') {
          metricsQuery += ` AND terkirim > 0`
        } else if (finalFilterType === 'gagal') {
          metricsQuery += ` AND gagal > 0`
        }
      }

      if (filterByMetric && !chartBarClicked) {
        switch(filterByMetric) {
          case 'hk':
            metricsQuery += ` AND EXTRACT(DOW FROM tanggal) != 0`
            break
          case 'hke':
            metricsQuery += ` AND (nama_freelance IS NULL OR nama_freelance = '' OR nama_freelance = '-')`
            break
          case 'hkne':
            metricsQuery += ` AND nama_freelance IS NOT NULL AND nama_freelance != '' AND nama_freelance != '-'`
            break
          case 'dp':
            metricsQuery += ` AND jumlah_toko > 0`
            break
        }
      }

      const metricsResult = await client.query(metricsQuery, metricsParams)
      const metrics = metricsResult.rows[0] || {
        total_hari_kerja: 0,
        hke: 0,
        hkne: 0,
        total_dp: 0,
        total_terkirim: 0,
        total_gagal: 0,
        total_shipments: 0
      }

      // 3. Query untuk chart data (TANPA filter tanggal spesifik)
      let chartDataQuery = `
        SELECT 
          tanggal::date as date,
          SUM(terkirim) as terkirim,
          SUM(gagal) as gagal,
          COUNT(*) as shipments_count,
          EXTRACT(DOW FROM tanggal) as day_of_week
        FROM shipment
        WHERE 1=1
      `

      const chartDataParams: any[] = []
      let chartParamIndex = 1

      if (userRole === 'regular') {
        chartDataQuery += ` AND user_id = $${chartParamIndex}`
        chartDataParams.push(userId)
        chartParamIndex++
      }

      if (fromDate) {
        chartDataQuery += ` AND tanggal >= $${chartParamIndex}`
        chartDataParams.push(fromDate)
        chartParamIndex++
      }

      if (toDate) {
        chartDataQuery += ` AND tanggal <= $${chartParamIndex}`
        chartDataParams.push(toDate)
        chartParamIndex++
      }

      if (search) {
        chartDataQuery += ` AND (
          nama_lengkap ILIKE $${chartParamIndex} OR
          shipment_id::text ILIKE $${chartParamIndex} OR
          tanggal::text ILIKE $${chartParamIndex} OR
          COALESCE(nama_freelance, '') ILIKE $${chartParamIndex}
        )`
        chartDataParams.push(`%${search}%`)
        chartParamIndex++
      }

      if (filterByMetric && !chartBarClicked) {
        switch(filterByMetric) {
          case 'hk':
            chartDataQuery += ` AND EXTRACT(DOW FROM tanggal) != 0`
            break
          case 'hke':
            chartDataQuery += ` AND (nama_freelance IS NULL OR nama_freelance = '' OR nama_freelance = '-')`
            break
          case 'hkne':
            chartDataQuery += ` AND nama_freelance IS NOT NULL AND nama_freelance != '' AND nama_freelance != '-'`
            break
          case 'dp':
            chartDataQuery += ` AND jumlah_toko > 0`
            break
        }
      }

      chartDataQuery += ` 
        GROUP BY tanggal::date, EXTRACT(DOW FROM tanggal) 
        ORDER BY tanggal::date ASC
      `

      const chartDataResult = await client.query(chartDataQuery, chartDataParams)
      
      const chartData = chartDataResult.rows.map(row => ({
        date: new Date(row.date).toISOString().split('T')[0],
        terkirim: Number(row.terkirim) || 0,
        gagal: Number(row.gagal) || 0,
        shipments_count: Number(row.shipments_count) || 0,
        day_of_week: Number(row.day_of_week) || 0,
        is_sunday: Number(row.day_of_week) === 0,
        // Flag untuk highlight di chart
        isFiltered: finalFilterDate ? 
          new Date(row.date).toISOString().split('T')[0] === finalFilterDate : false,
        filteredByType: finalFilterType && new Date(row.date).toISOString().split('T')[0] === finalFilterDate ? 
          finalFilterType : null
      }))

      client.release()

      const responseData = {
        success: true,
        shipments,
        cardboard: { 
          hk: Number(metrics.total_hari_kerja) || 0,
          hke: Number(metrics.hke) || 0,
          hkne: Number(metrics.hkne) || 0,
          totalDp: Number(metrics.total_dp) || 0,
          totalTerkirim: Number(metrics.total_terkirim) || 0,
          totalGagal: Number(metrics.total_gagal) || 0
        },
        chartData,
        total: shipments.length,
        activeFilters: {
          fromDate,
          toDate,
          search,
          filterByMetric,
          filterByDate: finalFilterDate,
          filterByType: finalFilterType,
          chartBarClicked,
          clickedDate,
          clickedType,
          userRole
        },
        metadata: {
          timestamp: new Date().toISOString(),
          chartDataPoints: chartData.length,
          isDateFiltered: !!finalFilterDate,
          isTypeFiltered: !!finalFilterType
        }
      }

      console.log('=== DASHBOARD API SUCCESS ===')
      return NextResponse.json(responseData)

    } catch (dbError) {
      client.release()
      console.error('Database query error:', dbError)
      throw dbError
    }

  } catch (error) {
    console.error('=== DASHBOARD API ERROR ===', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Internal server error',
        cardboard: {
          hk: 0, hke: 0, hkne: 0, totalDp: 0, totalTerkirim: 0, totalGagal: 0
        },
        shipments: [],
        chartData: [],
        total: 0,
        activeFilters: {},
        metadata: {
          timestamp: new Date().toISOString(),
          error: true
        }
      },
      { status: 500 }
    )
  }
}