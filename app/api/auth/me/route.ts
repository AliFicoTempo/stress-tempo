import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database/config'

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('stress_tempo_session')
    
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const sessionData = JSON.parse(sessionCookie.value)
    
    const client = await pool.connect()
    const result = await client.query(
      'SELECT user_id, nama_lengkap, username, role FROM "user" WHERE user_id = $1',
      [sessionData.userId]
    )
    client.release()

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: result.rows[0],
    })

  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}