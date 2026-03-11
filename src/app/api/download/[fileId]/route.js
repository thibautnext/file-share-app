import { query } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const { fileId } = params

    // Get file metadata
    const result = await query(
      `SELECT id, filename, size, blob_url, expires_at
       FROM shared_files 
       WHERE id = $1 AND expires_at > NOW()`,
      [fileId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'File not found or expired' },
        { status: 404 }
      )
    }

    const file = result.rows[0]

    // Increment download count
    await query(
      `UPDATE shared_files 
       SET download_count = download_count + 1, downloaded_at = NOW()
       WHERE id = $1`,
      [fileId]
    )

    // Redirect to Blob URL for download
    const response = await fetch(file.blob_url)
    const blob = await response.blob()
    
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${file.filename}"`,
        'Content-Length': file.size,
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
