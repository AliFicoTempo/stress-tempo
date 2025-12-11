import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database/config'
import { isSunday } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')
    
    const fromDate = searchParams.get('from')
    const toDate = searchParams.get('to')
    const search = searchParams.get('search')

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

    query += ` ORDER BY s.tanggal DESC, s.created_at DESC`

    const client = await pool.connect()
    const shipmentsResult = await client.query(query, queryParams)
    const shipments = shipmentsResult.rows

    // Ambil semua tanggal unik
    const dates: string[] = []
    const uniqueDates: string[] = []
    
    shipments.forEach(s => {
      if (!dates.includes(s.tanggal)) {
        dates.push(s.tanggal)
        uniqueDates.push(s.tanggal)
      }
    })
    
    // 1. HK: Total hari kerja (bukan Minggu)
    const hk = uniqueDates.filter(date => !isSunday(new Date(date))).length
    
    // 2. HKE: Hari kerja dengan shipment (jumlah_toko > 0)
    // PERHITUNGAN TETAP SAMA
    const hke = shipments.filter(s => s.jumlah_toko > 0).length > 0 ? 
      uniqueDates.filter(date => {
        const dateShipments = shipments.filter(s => s.tanggal === date)
        return dateShipments.length > 0 && !isSunday(new Date(date))
      }).length : 0
    
    // 3. HKNE BARU: Hitung shipment yang memiliki nama_freelance
    const hkne = shipments.filter(s => 
      s.nama_freelance && 
      s.nama_freelance.trim() !== '' && 
      s.nama_freelance !== '-'
    ).length

    // Data untuk chart
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
      cardboard: { hk, hke, hkne },
      chartData,
      total: shipments.length,
    })

  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}