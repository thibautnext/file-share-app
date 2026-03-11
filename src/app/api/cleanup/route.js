import { query } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request) {
  // Verify cron secret
  const secret = request.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { message: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // Delete expired files directly from database (files are stored as BYTEA)
    const result = await query(
      `DELETE FROM shared_files
       WHERE expires_at <= NOW()
       RETURNING id, filename`
    )

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

// Also support GET for easy testing
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
