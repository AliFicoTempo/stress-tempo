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
    
    // 2. HKE: Hari kerja yang memiliki shipment tapi TIDAK memiliki nama_freelance
    const hke = uniqueDates.filter(date => {
      const dateShipments = shipments.filter(s => s.tanggal === date)
      
      // Cek apakah ada shipment pada tanggal tersebut
      const hasShipments = dateShipments.length > 0
      
      // Cek apakah SEMUA shipment pada tanggal tersebut TIDAK memiliki nama_freelance
      const hasNoFreelance = dateShipments.every(s => 
        !s.nama_freelance || 
        s.nama_freelance.trim() === '' || 
        s.nama_freelance === '-'
      )
      
      // Hari kerja (bukan Minggu) dengan shipment TANPA freelance
      return !isSunday(new Date(date)) && hasShipments && hasNoFreelance
    }).length

    // 3. HKNE: Hari kerja yang memiliki shipment DENGAN nama_freelance
    const hkne = uniqueDates.filter(date => {
      const dateShipments = shipments.filter(s => s.tanggal === date)
      
      // Cek apakah ada shipment pada tanggal tersebut
      const hasShipments = dateShipments.length > 0
      
      // Cek apakah SETIDAKNYA SATU shipment pada tanggal tersebut memiliki nama_freelance
      const hasFreelance = dateShipments.some(s => 
        s.nama_freelance && 
        s.nama_freelance.trim() !== '' && 
        s.nama_freelance !== '-'
      )
      
      // Hari kerja (bukan Minggu) dengan shipment YANG MEMILIKI freelance
      return !isSunday(new Date(date)) && hasShipments && hasFreelance
    }).length

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