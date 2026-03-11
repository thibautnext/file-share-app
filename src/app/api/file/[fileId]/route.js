import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const { fileId } = params

    const result = await query(
      `SELECT id, filename, size, created_at, expires_at, password_hash 
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
    const now = new Date()
    const expiresAt = new Date(file.expires_at)
    const timeRemaining = expiresAt - now
    const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60))
    const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))

    return NextResponse.json({
      id: file.id,
      filename: file.filename,
      size: file.size,
      protected: !!file.password_hash,
      expiresAt: file.expires_at,
      timeRemaining: `${hoursRemaining}h ${minutesRemaining}m`,
      createdAt: file.created_at,
    })
  } catch (error) {
    console.error('Fetch file error:', error)
    return NextResponse.json(
      { message: 'Error fetching file' },
      { status: 500 }
    )
  }
}

export async function POST(request, { params }) {
  try {
    const { fileId } = params
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { message: 'Password required' },
        { status: 400 }
      )
    }

    const result = await query(
      `SELECT id, filename, size, created_at, expires_at, password_hash 
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

    if (!file.password_hash) {
      return NextResponse.json(
        { message: 'File is not password protected' },
        { status: 400 }
      )
    }

    const passwordMatch = await bcrypt.compare(password, file.password_hash)

    if (!passwordMatch) {
      return NextResponse.json(
        { message: 'Invalid password' },
        { status: 401 }
      )
    }

    const expiresAt = new Date(file.expires_at)
    const now = new Date()
    const timeRemaining = expiresAt - now
    const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60))
    const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))

    return NextResponse.json({
      id: file.id,
      filename: file.filename,
      size: file.size,
      protected: false,
      expiresAt: file.expires_at,
      timeRemaining: `${hoursRemaining}h ${minutesRemaining}m`,
      createdAt: file.created_at,
    })
  } catch (error) {
    console.error('Password verification error:', error)
    return NextResponse.json(
      { message: 'Error verifying password' },
      { status: 500 }
    )
  }
}
