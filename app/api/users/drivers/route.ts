import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database/config'

export async function GET(request: NextRequest) {
  try {
    const client = await pool.connect()
    
    const result = await client.query(
      'SELECT user_id, nama_lengkap, username FROM "user" WHERE role = $1 ORDER BY nama_lengkap',
      ['regular']
    )
    
    client.release()

    return NextResponse.json({
      success: true,
      drivers: result.rows,
    })

  } catch (error) {
    console.error('Get drivers error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}