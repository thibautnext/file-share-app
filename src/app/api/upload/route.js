import { handleUpload } from '@vercel/blob/client'
import { nanoid } from 'nanoid'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const body = await request.json()

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = clientPayload ? JSON.parse(clientPayload) : {}
        const fileId = nanoid(12)

        let passwordHash = null
        if (payload.password) {
          passwordHash = await bcrypt.hash(payload.password, 10)
        }

        return {
          maximumSizeInBytes: 100 * 1024 * 1024, // 100MB
          tokenPayload: JSON.stringify({
            fileId,
            passwordHash,
            isProtected: !!payload.password,
          }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const { fileId, passwordHash } = JSON.parse(tokenPayload)
        const createdAt = new Date()
        const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000)

        await query(
          `INSERT INTO shared_files
            (id, filename, size, blob_url, created_at, expires_at, password_hash, download_count)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [fileId, blob.pathname.split('/').pop(), blob.size, blob.url, createdAt, expiresAt, passwordHash, 0]
        )
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { message: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
}
