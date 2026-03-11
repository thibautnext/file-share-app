import { query } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const blobUrl = request.nextUrl.searchParams.get('blobUrl')

    if (!blobUrl) {
      return NextResponse.json(
        { message: 'Missing blobUrl parameter' },
        { status: 400 }
      )
    }

    // Poll for up to 5 seconds in case onUploadCompleted hasn't fired yet
    let file = null
    for (let i = 0; i < 10; i++) {
      const result = await query(
        `SELECT id, filename, size, password_hash, expires_at
         FROM shared_files
         WHERE blob_url = $1 AND deleted_at IS NULL`,
        [blobUrl]
      )
      if (result.rows.length > 0) {
        file = result.rows[0]
        break
      }
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    if (!file) {
      return NextResponse.json(
        { message: 'File not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      fileId: file.id,
      filename: file.filename,
      size: file.size,
      protected: !!file.password_hash,
      expiresAt: file.expires_at,
    })
  } catch (error) {
    console.error('Upload info error:', error)
    return NextResponse.json(
      { message: 'Error fetching upload info' },
      { status: 500 }
    )
  }
}
