const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function cleanup() {
  const client = await pool.connect()
  try {
    console.log('Starting cleanup of expired files...')

    // Delete expired files directly from database (files are stored as BYTEA)
    const result = await client.query(`
      DELETE FROM shared_files
      WHERE expires_at <= NOW()
      RETURNING id, filename
    `)

    console.log(`Cleanup completed! Deleted ${result.rows.length} expired files`)
  } catch (error) {
    console.error('Cleanup failed:', error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

cleanup()
