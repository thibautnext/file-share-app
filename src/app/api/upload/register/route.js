import { nanoid } from 'nanoid'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { blobUrl, filename, size, password } = await request.json()

    if (!blobUrl || !filename) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check for duplicate registration
    const existing = await query(
      `SELECT id FROM shared_files WHERE blob_url = $1`,
      [blobUrl]
    )
    if (existing.rows.length > 0) {
      return NextResponse.json({
        fileId: existing.rows[0].id,
        filename,
        size,
        protected: !!password,
      })
    }

    const fileId = nanoid(12)
    const createdAt = new Date()
    const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000)

    let passwordHash = null
    if (password) {
      passwordHash = await bcrypt.hash(password, 10)
    }

    await query(
      `INSERT INTO shared_files
        (id, filename, size, blob_url, created_at, expires_at, password_hash, download_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [fileId, filename, size, blobUrl, createdAt, expiresAt, passwordHash, 0]
    )

    return NextResponse.json({
      fileId,
      filename,
      size,
      protected: !!password,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { message: error.message || 'Registration failed' },
      { status: 500 }
    )
  }
}
