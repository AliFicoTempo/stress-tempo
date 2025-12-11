import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database/config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      user_id, 
      nama_lengkap, 
      nama_freelance,
      tanggal, 
      shipment_id, 
      jumlah_toko, 
      terkirim, 
      gagal, 
      alasan 
    } = body

    if (!user_id || !nama_lengkap || !nama_freelance || !tanggal || !shipment_id || !jumlah_toko || terkirim === undefined) {
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
        user_id, nama_lengkap, nama_freelance, tanggal, shipment_id, 
        jumlah_toko, terkirim, gagal, alasan
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `

    const values = [
      user_id, nama_lengkap, nama_freelance, tanggal, shipment_id, 
      jumlah_toko, terkirim, gagal || 0, alasan || null
    ]

    const result = await client.query(insertQuery, values)
    client.release()

    return NextResponse.json({
      success: true,
      message: 'Freelance shipment berhasil disimpan',
      shipment: result.rows[0],
    })

  } catch (error) {
    console.error('Create freelance shipment error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}