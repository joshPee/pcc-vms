import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!sql) {
      return NextResponse.json([]);
    }
    
    // Ensure shift column exists defensively
    try {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS shift VARCHAR(50) DEFAULT 'day';`;
    } catch {
      // Ignore if already exists or permission
    }

    const users = await sql`
      SELECT id, name, email, role, COALESCE(shift, 'day') as shift, created_at
      FROM users
      ORDER BY created_at DESC
    `;
    return NextResponse.json(users, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role, shift } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (!sql) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 500 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists (case-insensitive)
    const existingUser = await sql`
      SELECT id FROM users WHERE LOWER(email) = ${cleanEmail}
    `;

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'A user with this email address already exists' },
        { status: 409 }
      );
    }

    // Hash password with bcrypt before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    const normalizedRole = (role || 'security_officer').toLowerCase();
    const normalizedShift = (shift || 'day').toLowerCase();

    // Ensure shift column exists defensively
    try {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS shift VARCHAR(50) DEFAULT 'day';`;
    } catch {
      // Ignore
    }

    // Create new user
    const result = await sql`
      INSERT INTO users (name, email, password_hash, role, shift)
      VALUES (${name.trim()}, ${cleanEmail}, ${hashedPassword}, ${normalizedRole}, ${normalizedShift})
      RETURNING id, name, email, role, shift, created_at
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}
