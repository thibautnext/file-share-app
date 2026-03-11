import { nanoid } from 'nanoid'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db'
import { NextResponse } from 'next/server'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const password = formData.get('password')

    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      )
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: 'File too large. Max 100MB allowed.' },
        { status: 413 }
      )
    }

    const fileId = nanoid(12)
    const filename = file.name
    const fileSize = file.size
    const createdAt = new Date()
    const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000) // 24h

    let passwordHash = null
    if (password) {
      passwordHash = await bcrypt.hash(password, 10)
    }

    // Read file as buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Save file + metadata to PostgreSQL in one transaction
    const client = await query.pool.connect()
    try {
      await client.query('BEGIN')
      
      await client.query(
        `INSERT INTO shared_files 
          (id, filename, size, file_data, created_at, expires_at, password_hash, download_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [fileId, filename, fileSize, buffer, createdAt, expiresAt, passwordHash, 0]
      )

      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }

    return NextResponse.json({
      fileId,
      filename,
      size: fileSize,
      protected: !!password,
      downloadUrl: `/upload/${fileId}`,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { message: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
}
