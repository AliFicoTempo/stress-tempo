import { Pool } from 'pg'

// Konfigurasi koneksi database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // max number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Test connection
export async function testConnection() {
  try {
    const client = await pool.connect()
    console.log('✅ Database connected successfully')
    client.release()
    return true
  } catch (error) {
    console.error('❌ Database connection error:', error)
    return false
  }
}

// Export pool
export default pool