import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    if (!sql) {
      return NextResponse.json([]);
    }

    const vehicles = await sql`
      SELECT id, plate_number, make, model, color, owner_name, owner_phone, purpose, is_active, created_at
      FROM vehicles
      WHERE is_active = true
      ORDER BY created_at DESC
    `;
    return NextResponse.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { plate_number, make, model, color, owner_name, owner_phone, purpose } = body;

    if (!plate_number) {
      return NextResponse.json({ error: 'Plate number is required' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO vehicles (plate_number, make, model, color, owner_name, owner_phone, purpose, registered_by)
      VALUES (
        ${plate_number.toUpperCase()},
        ${make || null},
        ${model || null},
        ${color || null},
        ${owner_name || null},
        ${owner_phone || null},
        ${purpose || null},
        ${parseInt(session.user.id)}
      )
      RETURNING id, plate_number, make, model, color, owner_name, owner_phone, purpose, is_active, created_at
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error adding vehicle:', error);
    return NextResponse.json({ error: 'Failed to add vehicle' }, { status: 500 });
  }
}
