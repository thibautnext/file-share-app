import { query } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function DELETE(request, { params }) {
  try {
    const { fileId } = params

    // Delete the file
    const result = await query(
      `DELETE FROM shared_files 
       WHERE id = $1
       RETURNING id, filename`,
      [fileId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'File not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'File deleted successfully',
      filename: result.rows[0].filename,
    })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { message: 'Error deleting file' },
      { status: 500 }
    )
  }
}
