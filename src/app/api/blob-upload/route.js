import { nanoid } from 'nanoid'
import { NextResponse } from 'next/server'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const BLOB_BASE_URL = 'https://gbbhuris8w2gjm1t.public.blob.vercel-storage.com'

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

    // Generate unique file ID
    const fileId = nanoid(12)
    const blobPath = `file-share/${fileId}`
    const uploadUrl = `${BLOB_BASE_URL}/${blobPath}`

    // Upload directly to Vercel Blob via HTTP
    const buffer = Buffer.from(await file.arrayBuffer())
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': buffer.length.toString(),
      },
      body: buffer,
    })

    if (!uploadResponse.ok) {
      throw new Error(`Blob upload failed: ${uploadResponse.status}`)
    }

    return NextResponse.json({
      blobUrl: uploadUrl,
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
