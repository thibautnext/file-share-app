const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function migrate() {
  const client = await pool.connect()
  try {
    console.log('Running migrations...')

    // Create shared_files table
    await client.query(`
      CREATE TABLE IF NOT EXISTS shared_files (
        id VARCHAR(12) PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        size BIGINT NOT NULL,
        blob_url TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        password_hash VARCHAR(255),
        download_count INTEGER DEFAULT 0,
        downloaded_at TIMESTAMP,
        deleted_at TIMESTAMP,
        created_ip VARCHAR(45),
        user_agent TEXT
      );
    `)

    // Add blob_url column if missing
    await client.query(`
      ALTER TABLE shared_files
      ADD COLUMN IF NOT EXISTS blob_url TEXT;
    `)

    // Make file_data nullable (no longer required)
    await client.query(`
      ALTER TABLE shared_files
      ALTER COLUMN file_data DROP NOT NULL;
    `)

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_shared_files_expires_at
      ON shared_files(expires_at);
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_shared_files_created_at
      ON shared_files(created_at);
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_shared_files_blob_url
      ON shared_files(blob_url);
    `)

    console.log('Migrations completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()
