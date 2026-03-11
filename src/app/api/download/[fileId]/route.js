import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const { fileId } = params

    const result = await query(
      `SELECT id, filename, size, blob_url, expires_at, password_hash
       FROM shared_files
       WHERE id = $1 AND expires_at > NOW() AND deleted_at IS NULL`,
      [fileId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'File not found or expired' },
        { status: 404 }
      )
    }

    const file = result.rows[0]

    // Check password protection
    if (file.password_hash) {
      const url = new URL(request.url)
      const token = url.searchParams.get('token')
      if (!token) {
        return NextResponse.json(
          { message: 'Password required' },
          { status: 401 }
        )
      }
      const passwordMatch = await bcrypt.compare(token, file.password_hash)
      if (!passwordMatch) {
        return NextResponse.json(
          { message: 'Invalid password' },
          { status: 401 }
        )
      }
    }

    // Increment download count
    await query(
      `UPDATE shared_files
       SET download_count = download_count + 1, downloaded_at = NOW()
       WHERE id = $1`,
      [fileId]
    )

    // Fetch from Vercel Blob and stream back with correct filename
    const blobResponse = await fetch(file.blob_url)
    if (!blobResponse.ok) {
      return NextResponse.json(
        { message: 'Error fetching file from storage' },
        { status: 500 }
      )
    }

    return new NextResponse(blobResponse.body, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${file.filename}"`,
        'Content-Length': String(file.size),
      },
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { message: 'Error downloading file' },
      { status: 500 }
    )
  }
}
