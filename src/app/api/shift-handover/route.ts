import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    if (!sql) {
      return NextResponse.json([]);
    }

    const handovers = await sql`
      SELECT 
        id,
        outgoing_officer,
        incoming_officer,
        shift_date,
        notes,
        visitors_on_site,
        incidents,
        pending_tasks,
        equipment_status,
        created_by,
        created_at,
        updated_at
      FROM shift_handovers
      ORDER BY shift_date DESC, created_at DESC
    `;
    return NextResponse.json(handovers);
  } catch (error) {
    console.error('Error fetching shift handovers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shift handovers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    if (!outgoing_officer || !incoming_officer || !shift_date) {
      return NextResponse.json(
        { error: 'Outgoing officer, incoming officer, and shift date are required' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO shift_handovers (
        outgoing_officer,
        incoming_officer,
        shift_date,
        notes,
        visitors_on_site,
        incidents,
        pending_tasks,
        equipment_status,
        created_by
      )
      VALUES (
        ${outgoing_officer},
        ${incoming_officer},
        ${shift_date},
        ${notes || null},
        ${visitors_on_site || null},
        ${incidents || null},
        ${pending_tasks || null},
        ${equipment_status || null},
        ${parseInt(session.user.id)}
      )
      RETURNING id, outgoing_officer, incoming_officer, shift_date, notes, visitors_on_site, incidents, pending_tasks, equipment_status, created_at
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating shift handover:', error);
    return NextResponse.json(
      { error: 'Failed to create shift handover' },
      { status: 500 }
    );
  }
}