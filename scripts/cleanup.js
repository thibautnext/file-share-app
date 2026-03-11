const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function cleanup() {
  const client = await pool.connect()
  try {
    console.log('Starting cleanup of expired files...')

    const result = await client.query(`
      DELETE FROM shared_files
      WHERE expires_at <= NOW()
      RETURNING id, filename, blob_url
    `)

    // Note: blob cleanup is handled by the API route via @vercel/blob del()
    // This script only cleans the database
    console.log(`Cleanup completed! Deleted ${result.rows.length} expired files from database`)
  } catch (error) {
    console.error('Cleanup failed:', error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

cleanup()
