import { nanoid } from 'nanoid'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db'
import { NextResponse } from 'next/server'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

export async function POST(request) {
  try {
    const json = await request.json()
    const { filename, fileSize, password, blobUrl } = json

    if (!filename || !fileSize || !blobUrl) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check file size
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: 'File too large. Max 100MB allowed.' },
        { status: 413 }
      )
    }

    const fileId = nanoid(12)
    const createdAt = new Date()
    const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000) // 24h

    let passwordHash = null
    if (password) {
      passwordHash = await bcrypt.hash(password, 10)
    }

    // Save metadata to database
    await query(
      `INSERT INTO shared_files 
        (id, filename, size, blob_url, created_at, expires_at, password_hash, download_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [fileId, filename, fileSize, blobUrl, createdAt, expiresAt, passwordHash, 0]
    )

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
