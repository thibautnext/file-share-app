const { Pool } = require('pg')
const { unlink } = require('fs/promises')
const { join } = require('path')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function cleanup() {
  const client = await pool.connect()
  try {
    console.log('🧹 Starting cleanup of expired files...')

    // Find expired files
    const result = await client.query(`
      SELECT id, filename FROM shared_files 
      WHERE expires_at <= NOW() AND deleted_at IS NULL
      LIMIT 1000
    `)

    const expiredFiles = result.rows
    console.log(`Found ${expiredFiles.length} expired files`)

    // Delete files from storage
    const uploadDir = process.env.NAS_UPLOAD_PATH || '/tmp/uploads'
    
    let deleted = 0
    for (const file of expiredFiles) {
      try {
        const filePath = join(uploadDir, file.id)
        await unlink(filePath)
        console.log(`✓ Deleted: ${file.filename}`)
        deleted++
      } catch (err) {
        console.warn(`⚠️ Failed to delete ${file.filename}:`, err.message)
      }

      // Mark as deleted in database
      await client.query(
        `UPDATE shared_files SET deleted_at = NOW() WHERE id = $1`,
        [file.id]
      )
    }

    console.log(`✅ Cleanup completed! Deleted ${deleted}/${expiredFiles.length} files`)
  } catch (error) {
    console.error('❌ Cleanup failed:', error)
    process.exit(1)
  } finally {
    await client.release()
    await pool.end()
  }
}

cleanup()
