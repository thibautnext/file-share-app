import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'

export async function DELETE(request, { params }) {
  try {
    const { fileId } = params

    // Check if file exists and if it's password protected
    const checkResult = await query(
      `SELECT id, filename, password_hash
       FROM shared_files
       WHERE id = $1 AND deleted_at IS NULL`,
      [fileId]
    )

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { message: 'File not found' },
        { status: 404 }
      )
    }

    const file = checkResult.rows[0]

    // Verify password for protected files
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

    // Delete the file
    await query(
      `DELETE FROM shared_files WHERE id = $1`,
      [fileId]
    )

    return NextResponse.json({
      message: 'File deleted successfully',
      filename: file.filename,
    })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { message: 'Error deleting file' },
      { status: 500 }
    )
  }
}
