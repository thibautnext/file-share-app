import { query } from '@/lib/db'
import { del } from '@vercel/blob'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const secret = request.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { message: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // Get expired files with their blob URLs
    const result = await query(
      `DELETE FROM shared_files
       WHERE expires_at <= NOW()
       RETURNING id, filename, blob_url`
    )

    // Delete blobs from Vercel Blob storage
    for (const file of result.rows) {
      if (file.blob_url) {
        try {
          await del(file.blob_url)
        } catch (err) {
          console.warn(`Failed to delete blob for ${file.id}:`, err.message)
        }
      }
    }

    return NextResponse.json({
      message: `Cleaned up ${result.rows.length} expired files`,
      deletedCount: result.rows.length,
    })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      { message: 'Cleanup failed', error: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  const secret = request.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { message: 'Unauthorized' },
      { status: 401 }
    )
  }

  return POST(request)
}
