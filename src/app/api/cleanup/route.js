import { query } from '@/lib/db'
import { unlink } from 'fs/promises'
import { join } from 'path'
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
    // Find expired files
    const result = await query(
      `SELECT id, filename FROM shared_files 
       WHERE expires_at <= NOW() AND deleted_at IS NULL
       LIMIT 1000`
    )

    const expiredFiles = result.rows

    // Delete files from storage
    const uploadDir = process.env.NAS_UPLOAD_PATH || '/tmp/uploads'
    
    for (const file of expiredFiles) {
      try {
        const filePath = join(uploadDir, file.id)
        await unlink(filePath)
      } catch (err) {
        console.warn(`Failed to delete file ${file.id}:`, err)
      }

      // Mark as deleted in database
      await query(
        `UPDATE shared_files 
         SET deleted_at = NOW()
         WHERE id = $1`,
        [file.id]
      )
    }

    return NextResponse.json({
      message: `Cleaned up ${expiredFiles.length} expired files`,
      deletedCount: expiredFiles.length,
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
