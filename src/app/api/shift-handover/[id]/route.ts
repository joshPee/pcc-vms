import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      outgoing_officer, 
      incoming_officer, 
      shift_date, 
      notes, 
      visitors_on_site, 
      incidents, 
      pending_tasks, 
      equipment_status 
    } = body;
    const { id } = await params;
    const parsedId = parseInt(id);

    const result = await sql`
      UPDATE shift_handovers
      SET 
        outgoing_officer = ${outgoing_officer},
        incoming_officer = ${incoming_officer},
        shift_date = ${shift_date},
        notes = ${notes || null},
        visitors_on_site = ${visitors_on_site || null},
        incidents = ${incidents || null},
        pending_tasks = ${pending_tasks || null},
        equipment_status = ${equipment_status || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${parsedId}
      RETURNING id, outgoing_officer, incoming_officer, shift_date, notes, visitors_on_site, incidents, pending_tasks, equipment_status, updated_at
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Shift handover not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating shift handover:', error);
    return NextResponse.json(
      { error: 'Failed to update shift handover' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const parsedId = parseInt(id);

    const result = await sql`
      DELETE FROM shift_handovers
      WHERE id = ${parsedId}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Shift handover not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting shift handover:', error);
    return NextResponse.json(
      { error: 'Failed to delete shift handover' },
      { status: 500 }
    );
  }
}