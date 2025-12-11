import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database/config'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username dan password harus diisi' },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    const result = await client.query(
      'SELECT * FROM "user" WHERE username = $1 AND password = $2',
      [username, password]
    )
    client.release()

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Username atau password salah' },
        { status: 401 }
      )
    }

    const user = result.rows[0]

    const response = NextResponse.json({
      success: true,
      user: {
        user_id: user.user_id,
        nama_lengkap: user.nama_lengkap,
        username: user.username,
        role: user.role,
      },
    })

    // Set session cookie
    response.cookies.set({
      name: 'stress_tempo_session',
      value: JSON.stringify({
        userId: user.user_id,
        username: user.username,
        role: user.role,
      }),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24,
      path: '/',
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}