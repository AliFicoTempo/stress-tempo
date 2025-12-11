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

    let query = 'SELECT * FROM shipment WHERE 1=1'
    const queryParams: any[] = []
    let paramIndex = 1

    if (userRole === 'regular') {
      query += ` AND user_id = $${paramIndex}`
      queryParams.push(userId)
      paramIndex++
    }

    if (fromDate) {
      query += ` AND tanggal >= $${paramIndex}`
      queryParams.push(fromDate)
      paramIndex++
    }

    if (toDate) {
      query += ` AND tanggal <= $${paramIndex}`
      queryParams.push(toDate)
      paramIndex++
    }

    if (search) {
      query += ` AND (
        nama_lengkap ILIKE $${paramIndex} OR
        shipment_id ILIKE $${paramIndex} OR
        tanggal::text ILIKE $${paramIndex}
      )`
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    query += ' ORDER BY tanggal DESC, created_at DESC'

    const client = await pool.connect()
    const result = await client.query(query, queryParams)
    client.release()

    return NextResponse.json({
      success: true,
      shipments: result.rows,
      total: result.rows.length,
    })

  } catch (error) {
    console.error('Get shipments error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      user_id, 
      nama_lengkap, 
      tanggal, 
      shipment_id, 
      jumlah_toko, 
      terkirim, 
      gagal, 
      alasan 
    } = body

    if (!user_id || !nama_lengkap || !tanggal || !shipment_id || !jumlah_toko || terkirim === undefined) {
      return NextResponse.json(
        { success: false, message: 'Data tidak lengkap' },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    
    const checkQuery = 'SELECT id FROM shipment WHERE shipment_id = $1'
    const checkResult = await client.query(checkQuery, [shipment_id])
    
    if (checkResult.rows.length > 0) {
      client.release()
      return NextResponse.json(
        { success: false, message: 'Shipment ID sudah terdaftar' },
        { status: 400 }
      )
    }

    const insertQuery = `
      INSERT INTO shipment (
        user_id, nama_lengkap, tanggal, shipment_id, 
        jumlah_toko, terkirim, gagal, alasan
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `

    const values = [
      user_id, nama_lengkap, tanggal, shipment_id, 
      jumlah_toko, terkirim, gagal || 0, alasan || null
    ]

    const result = await client.query(insertQuery, values)
    client.release()

    return NextResponse.json({
      success: true,
      message: 'Shipment berhasil disimpan',
      shipment: result.rows[0],
    })

  } catch (error) {
    console.error('Create shipment error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}