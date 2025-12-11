import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database/config'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')
    
    const fromDate = searchParams.get('from')
    const toDate = searchParams.get('to')
    const search = searchParams.get('search')
    
    // 🆕 PARAMETER FILTER BARU DARI CARDBOARD/CHART
    const filterByMetric = searchParams.get('filterByMetric') // 'hk', 'hke', 'hkne', 'dp', 'terkirim', 'gagal'
    const filterByDate = searchParams.get('filterByDate') // tanggal spesifik dari chart
    const filterByType = searchParams.get('filterByType') // 'terkirim' atau 'gagal' dari chart

    let query = `
      SELECT s.*, u.role 
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

    if (search) {
      query += ` AND (
        s.nama_lengkap ILIKE $${paramIndex} OR
        s.shipment_id ILIKE $${paramIndex} OR
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
    }

    if (filterByType) {
      if (filterByType === 'terkirim') {
        query += ` AND s.terkirim > 0`
      } else if (filterByType === 'gagal') {
        query += ` AND s.gagal > 0`
      }
    }

    if (filterByMetric) {
      switch(filterByMetric) {
        case 'hk':
          // Hari kerja (tidak filter spesifik, tetap pakai filter tanggal)
          break
        case 'hke':
          // Hanya shipment TANPA freelance
          query += ` AND (s.nama_freelance IS NULL OR s.nama_freelance = '' OR s.nama_freelance = '-')`
          break
        case 'hkne':
          // Hanya shipment DENGAN freelance
          query += ` AND s.nama_freelance IS NOT NULL AND s.nama_freelance != '' AND s.nama_freelance != '-'`
          break
        case 'dp':
          // Shipment dengan jumlah toko > 0
          query += ` AND s.jumlah_toko > 0`
          break
        case 'terkirim':
          // Shipment dengan terkirim > 0
          query += ` AND s.terkirim > 0`
          break
        case 'gagal':
          // Shipment dengan gagal > 0
          query += ` AND s.gagal > 0`
          break
      }
    }

    query += ` ORDER BY s.tanggal DESC, s.created_at DESC`

    const client = await pool.connect()
    
    // 1. Query untuk shipments dengan filter
    const shipmentsResult = await client.query(query, queryParams)
    const shipments = shipmentsResult.rows

    // 2. Query untuk metrics - PERBAIKAN DI SINI
    let metricsQuery = `
      SELECT 
        COUNT(DISTINCT tanggal) as total_hari,
        COUNT(DISTINCT CASE 
          WHEN EXTRACT(DOW FROM tanggal) != 0 THEN tanggal 
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
        COALESCE(SUM(gagal), 0) as total_gagal
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
        shipment_id ILIKE $${metricsParamIndex} OR
        tanggal::text ILIKE $${metricsParamIndex} OR
        COALESCE(nama_freelance, '') ILIKE $${metricsParamIndex}
      )`
      metricsParams.push(`%${search}%`)
      metricsParamIndex++
    }

    // Apply additional filters to metrics if they exist
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

    const metricsResult = await client.query(metricsQuery, metricsParams)
    const metrics = metricsResult.rows[0] || {
      total_hari_kerja: 0,
      hke: 0,
      hkne: 0,
      total_dp: 0,
      total_terkirim: 0,
      total_gagal: 0
    }

    // Data untuk chart (filtered)
    const chartData = shipments.reduce((acc: any[], shipment) => {
      const existing = acc.find(item => item.date === shipment.tanggal)
      if (existing) {
        existing.terkirim += shipment.terkirim
        existing.gagal += shipment.gagal
      } else {
        acc.push({
          date: shipment.tanggal,
          terkirim: shipment.terkirim,
          gagal: shipment.gagal,
        })
      }
      return acc
    }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    client.release()

    return NextResponse.json({
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
      // 🆕 Kembalikan filter yang aktif
      activeFilters: {
        filterByMetric,
        filterByDate,
        filterByType
      }
    })

  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Terjadi kesalahan server',
        cardboard: {
          hk: 0,
          hke: 0,
          hkne: 0,
          totalDp: 0,
          totalTerkirim: 0,
          totalGagal: 0
        },
        shipments: [],
        chartData: [],
        total: 0
      },
      { status: 500 }
    )
  }
}