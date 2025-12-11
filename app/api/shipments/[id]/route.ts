import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database/config'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID tidak valid' },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    
    let query = 'DELETE FROM shipment WHERE id = $1'
    const queryParams: any[] = [id]

    if (userRole === 'regular') {
      query += ' AND user_id = $2'
      queryParams.push(userId)
    }

    const result = await client.query(query, queryParams)
    client.release()

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Data tidak ditemukan atau tidak memiliki izin' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Shipment berhasil dihapus',
    })

  } catch (error) {
    console.error('Delete shipment error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID tidak valid' },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    
    let checkQuery = 'SELECT * FROM shipment WHERE id = $1'
    const checkParams: any[] = [id]

    if (userRole === 'regular') {
      checkQuery += ' AND user_id = $2'
      checkParams.push(userId)
    }

    const checkResult = await client.query(checkQuery, checkParams)
    
    if (checkResult.rows.length === 0) {
      client.release()
      return NextResponse.json(
        { success: false, message: 'Data tidak ditemukan atau tidak memiliki izin' },
        { status: 404 }
      )
    }

    const { 
      tanggal, 
      shipment_id, 
      jumlah_toko, 
      terkirim, 
      gagal, 
      alasan 
    } = body

    const updateQuery = `
      UPDATE shipment 
      SET tanggal = $1, shipment_id = $2, jumlah_toko = $3, 
          terkirim = $4, gagal = $5, alasan = $6, updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `

    const values = [
      tanggal, shipment_id, jumlah_toko, 
      terkirim, gagal || 0, alasan || null, id
    ]

    const result = await client.query(updateQuery, values)
    client.release()

    return NextResponse.json({
      success: true,
      message: 'Shipment berhasil diperbarui',
      shipment: result.rows[0],
    })

  } catch (error) {
    console.error('Update shipment error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}