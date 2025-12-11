import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database/config'

export async function GET(request: NextRequest) {
  console.log('=== DASHBOARD API START ===')
  
  try {
    // Debug: Log semua headers
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })
    console.log('Request headers:', headers)

    const searchParams = request.nextUrl.searchParams
    console.log('Search params:', Object.fromEntries(searchParams.entries()))

    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')
    
    console.log('User info from headers:', { userId, userRole })
    
    // Validasi headers
    if (!userId || !userRole) {
      console.error('Missing user headers:', { userId, userRole })
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
    
    // 🆕 PARAMETER FILTER BARU DARI CARDBOARD/CHART
    const filterByMetric = searchParams.get('filterByMetric')
    const filterByDate = searchParams.get('filterByDate')
    const filterByType = searchParams.get('filterByType')

    console.log('Filter params:', { fromDate, toDate, search, filterByMetric, filterByDate, filterByType })

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

    // Filter berdasarkan user role
    if (userRole === 'regular') {
      query += ` AND s.user_id = $${paramIndex}`
      queryParams.push(userId)
      paramIndex++
      console.log('Added regular user filter, user_id:', userId)
    }

    // Filter tanggal range
    if (fromDate) {
      query += ` AND s.tanggal >= $${paramIndex}`
      queryParams.push(fromDate)
      paramIndex++
    }

    if (toDate) {
      query += ` AND s.tanggal <= $${paramIndex}`
      queryParams.push(toDate)
      paramIndex++
    }

    // Filter search
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

    // 🆕 FILTER TAMBAHAN DARI CARDBOARD/CHART
    if (filterByDate) {
      query += ` AND s.tanggal = $${paramIndex}`
      queryParams.push(filterByDate)
      paramIndex++
      console.log('Added filter by date:', filterByDate)
    }

    if (filterByType) {
      if (filterByType === 'terkirim') {
        query += ` AND s.terkirim > 0`
        console.log('Added filter: only shipments with terkirim > 0')
      } else if (filterByType === 'gagal') {
        query += ` AND s.gagal > 0`
        console.log('Added filter: only shipments with gagal > 0')
      }
    }

    if (filterByMetric) {
      switch(filterByMetric) {
        case 'hk':
          // Hari kerja - hanya filter hari Minggu
          query += ` AND EXTRACT(DOW FROM s.tanggal) != 0`
          console.log('Added filter: hari kerja (exclude Sunday)')
          break
        case 'hke':
          // Hanya shipment TANPA freelance
          query += ` AND (s.nama_freelance IS NULL OR s.nama_freelance = '' OR s.nama_freelance = '-')`
          console.log('Added filter: shipment tanpa freelance (HKE)')
          break
        case 'hkne':
          // Hanya shipment DENGAN freelance
          query += ` AND s.nama_freelance IS NOT NULL AND s.nama_freelance != '' AND s.nama_freelance != '-'`
          console.log('Added filter: shipment dengan freelance (HKNE)')
          break
        case 'dp':
          // Shipment dengan jumlah toko > 0
          query += ` AND s.jumlah_toko > 0`
          console.log('Added filter: shipment dengan DP > 0')
          break
        case 'terkirim':
          // Shipment dengan terkirim > 0
          query += ` AND s.terkirim > 0`
          console.log('Added filter: shipment terkirim > 0')
          break
        case 'gagal':
          // Shipment dengan gagal > 0
          query += ` AND s.gagal > 0`
          console.log('Added filter: shipment gagal > 0')
          break
        default:
          console.log('No specific metric filter applied')
      }
    }

    query += ` ORDER BY s.tanggal DESC, s.created_at DESC`

    console.log('Final query:', query)
    console.log('Query params:', queryParams)

    const client = await pool.connect()
    console.log('Database connected successfully')

    try {
      // 1. Query untuk shipments dengan filter
      const shipmentsResult = await client.query(query, queryParams)
      console.log('Shipments found:', shipmentsResult.rows.length)
      
      // Normalize data types untuk konsistensi
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
        // Additional calculated fields
        day_of_week: Number(row.day_of_week) || 0,
        is_sunday: Number(row.day_of_week) === 0,
        has_freelance: row.nama_freelance && 
                      row.nama_freelance !== '' && 
                      row.nama_freelance !== '-',
        success_rate: row.terkirim > 0 ? 
          Math.round((row.terkirim / (row.terkirim + (row.gagal || 0))) * 100) : 0
      }))

      // 2. Query untuk metrics dengan filter yang sama
      let metricsQuery = `
        SELECT 
          -- Total hari unik (tanpa Minggu)
          COUNT(DISTINCT CASE 
            WHEN EXTRACT(DOW FROM tanggal) != 0 
            THEN tanggal 
            ELSE NULL 
          END) as total_hari_kerja,
          
          -- HKE: Hari kerja tanpa freelance
          COUNT(DISTINCT CASE 
            WHEN EXTRACT(DOW FROM tanggal) != 0 
              AND (nama_freelance IS NULL OR nama_freelance = '' OR nama_freelance = '-')
            THEN tanggal 
            ELSE NULL 
          END) as hke,
          
          -- HKNE: Hari kerja dengan freelance
          COUNT(DISTINCT CASE 
            WHEN EXTRACT(DOW FROM tanggal) != 0 
              AND nama_freelance IS NOT NULL 
              AND nama_freelance != '' 
              AND nama_freelance != '-'
            THEN tanggal 
            ELSE NULL 
          END) as hkne,
          
          -- Total DP
          COALESCE(SUM(jumlah_toko), 0) as total_dp,
          
          -- Total Terkirim
          COALESCE(SUM(terkirim), 0) as total_terkirim,
          
          -- Total Gagal
          COALESCE(SUM(gagal), 0) as total_gagal,
          
          -- Additional metrics
          COUNT(*) as total_shipments,
          COUNT(DISTINCT user_id) as total_users,
          COUNT(DISTINCT nama_freelance) FILTER (WHERE nama_freelance IS NOT NULL AND nama_freelance != '' AND nama_freelance != '-') as total_freelancers
        FROM shipment
        WHERE 1=1
      `

      const metricsParams: any[] = []
      let metricsParamIndex = 1

      // Apply same filters to metrics query
      if (userRole === 'regular') {
        metricsQuery += ` AND user_id = $${metricsParamIndex}`
        metricsParams.push(userId)
        metricsParamIndex++
      }

      if (fromDate) {
        metricsQuery += ` AND tanggal >= $${metricsParamIndex}`
        metricsParams.push(fromDate)
        metricsParamIndex++
      }

      if (toDate) {
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

      if (filterByDate) {
        metricsQuery += ` AND tanggal = $${metricsParamIndex}`
        metricsParams.push(filterByDate)
        metricsParamIndex++
      }

      if (filterByType) {
        if (filterByType === 'terkirim') {
          metricsQuery += ` AND terkirim > 0`
        } else if (filterByType === 'gagal') {
          metricsQuery += ` AND gagal > 0`
        }
      }

      if (filterByMetric) {
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
          case 'terkirim':
            metricsQuery += ` AND terkirim > 0`
            break
          case 'gagal':
            metricsQuery += ` AND gagal > 0`
            break
        }
      }

      console.log('Metrics query:', metricsQuery)
      console.log('Metrics params:', metricsParams)

      const metricsResult = await client.query(metricsQuery, metricsParams)
      const metrics = metricsResult.rows[0] || {
        total_hari_kerja: 0,
        hke: 0,
        hkne: 0,
        total_dp: 0,
        total_terkirim: 0,
        total_gagal: 0,
        total_shipments: 0,
        total_users: 0,
        total_freelancers: 0
      }

      console.log('Metrics calculated:', metrics)

      // 3. Data untuk chart (dikelompokkan per tanggal)
      const chartData = shipments.reduce((acc: any[], shipment) => {
        const existing = acc.find(item => item.date === shipment.tanggal)
        if (existing) {
          existing.terkirim += shipment.terkirim
          existing.gagal += shipment.gagal
          existing.shipments_count += 1
        } else {
          acc.push({
            date: shipment.tanggal,
            terkirim: shipment.terkirim,
            gagal: shipment.gagal,
            shipments_count: 1,
            day_of_week: shipment.day_of_week,
            is_sunday: shipment.is_sunday
          })
        }
        return acc
      }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      console.log('Chart data points:', chartData.length)

      // 4. Data tambahan untuk analisis
      const analysis = {
        by_freelance: shipments.reduce((acc: any, shipment) => {
          const freelance = shipment.nama_freelance || 'Tanpa Freelance'
          if (!acc[freelance]) {
            acc[freelance] = {
              freelance_name: freelance,
              total_shipments: 0,
              total_terkirim: 0,
              total_gagal: 0,
              total_dp: 0,
              success_rate: 0
            }
          }
          acc[freelance].total_shipments += 1
          acc[freelance].total_terkirim += shipment.terkirim
          acc[freelance].total_gagal += shipment.gagal
          acc[freelance].total_dp += shipment.jumlah_toko
          return acc
        }, {}),
        
        by_day: shipments.reduce((acc: any, shipment) => {
          const day = shipment.tanggal
          if (!acc[day]) {
            acc[day] = {
              date: day,
              total_shipments: 0,
              total_terkirim: 0,
              total_gagal: 0,
              day_of_week: shipment.day_of_week,
              is_sunday: shipment.is_sunday
            }
          }
          acc[day].total_shipments += 1
          acc[day].total_terkirim += shipment.terkirim
          acc[day].total_gagal += shipment.gagal
          return acc
        }, {})
      }

      // Hitung success rate untuk setiap freelance
      Object.values(analysis.by_freelance).forEach((f: any) => {
        const total = f.total_terkirim + f.total_gagal
        f.success_rate = total > 0 ? Math.round((f.total_terkirim / total) * 100) : 0
      })

      client.release()
      console.log('Database connection released')

      // Response data lengkap
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
        additionalMetrics: {
          totalShipments: Number(metrics.total_shipments) || 0,
          totalUsers: Number(metrics.total_users) || 0,
          totalFreelancers: Number(metrics.total_freelancers) || 0,
          successRate: metrics.total_terkirim + metrics.total_gagal > 0 ? 
            Math.round((Number(metrics.total_terkirim) / (Number(metrics.total_terkirim) + Number(metrics.total_gagal))) * 100) : 0
        },
        chartData,
        analysis: {
          byFreelance: Object.values(analysis.by_freelance),
          byDay: Object.values(analysis.by_day)
        },
        total: shipments.length,
        pagination: {
          page: 1,
          limit: shipments.length,
          total: shipments.length,
          hasMore: false
        },
        activeFilters: {
          fromDate,
          toDate,
          search,
          filterByMetric,
          filterByDate,
          filterByType,
          userRole,
          userId
        },
        metadata: {
          timestamp: new Date().toISOString(),
          queryTime: new Date().toISOString(),
          dataVersion: '1.0'
        }
      }

      console.log('=== DASHBOARD API SUCCESS ===')
      console.log('Total shipments:', shipments.length)
      console.log('Chart data points:', chartData.length)
      console.log('Metrics calculated successfully')

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
        errorDetails: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.stack : String(error)) : undefined,
        cardboard: {
          hk: 0, hke: 0, hkne: 0, totalDp: 0, totalTerkirim: 0, totalGagal: 0
        },
        additionalMetrics: {
          totalShipments: 0,
          totalUsers: 0,
          totalFreelancers: 0,
          successRate: 0
        },
        shipments: [],
        chartData: [],
        analysis: {
          byFreelance: [],
          byDay: []
        },
        total: 0,
        pagination: {
          page: 1,
          limit: 0,
          total: 0,
          hasMore: false
        },
        activeFilters: {},
        metadata: {
          timestamp: new Date().toISOString(),
          queryTime: new Date().toISOString(),
          error: true
        }
      },
      { status: 500 }
    )
  }
}