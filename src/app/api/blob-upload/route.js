import { put } from '@vercel/blob'
import { nanoid } from 'nanoid'
import { NextResponse } from 'next/server'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

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

    // Upload directly to Vercel Blob using stream
    const fileId = nanoid(12)
    
    const blob = await put(`file-share/${fileId}`, file.stream(), {
      access: 'public',
    })

    return NextResponse.json({
      blobUrl: blob.url,
      fileId,
    })
  } catch (error) {
    console.error('Blob upload error:', error)
    return NextResponse.json(
      { message: error.message || 'File upload failed' },
      { status: 500 }
    )
  }
}
