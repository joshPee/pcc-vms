import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { plate_number, make, model, color, owner_name, owner_phone, purpose, is_active } = body;
    const { id } = await context.params;
    const parsedId = parseInt(id);

    if (!plate_number) {
      return NextResponse.json(
        { error: 'Plate number is required' },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE vehicles
      SET plate_number = ${plate_number.toUpperCase()},
          make = ${make || null},
          model = ${model || null},
          color = ${color || null},
          owner_name = ${owner_name || null},
          owner_phone = ${owner_phone || null},
          purpose = ${purpose || null},
          is_active = ${is_active !== undefined ? is_active : true},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${parsedId}
      RETURNING id, plate_number, make, model, color, owner_name, owner_phone, purpose, is_active, updated_at
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return NextResponse.json({ error: 'Failed to update vehicle' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const parsedId = parseInt(id);

    const result = await sql`
      UPDATE vehicles
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${parsedId}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Vehicle deactivated' });
  } catch (error) {
    console.error('Error deactivating vehicle:', error);
    return NextResponse.json({ error: 'Failed to deactivate vehicle' }, { status: 500 });
  }
}