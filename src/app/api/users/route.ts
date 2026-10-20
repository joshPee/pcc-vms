import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    if (!sql) {
      return NextResponse.json([]);
    }
    
    const users = await sql`
      SELECT id, name, email, role, shift, created_at
      FROM users
      ORDER BY created_at DESC
    `;
    return NextResponse.json(users);
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

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password with bcrypt before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    const normalizedRole = (role || 'security_officer').toLowerCase();
    const normalizedShift = (shift || 'day').toLowerCase();

    // Create new user
    const result = await sql`
      INSERT INTO users (name, email, password_hash, role, shift)
      VALUES (${name}, ${email.toLowerCase().trim()}, ${hashedPassword}, ${normalizedRole}, ${normalizedShift})
      RETURNING id, name, email, role, shift, created_at
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
