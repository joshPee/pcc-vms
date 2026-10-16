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
    const { title, description, incident_type, severity, location, reported_by, status } = body;
    const { id } = await params;
    const parsedId = parseInt(id);

    if (!title || !incident_type) {
      return NextResponse.json(
        { error: 'Title and incident type are required' },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE incidents
      SET title = ${title},
          description = ${description || null},
          incident_type = ${incident_type},
          severity = ${severity || 'Low'},
          location = ${location || null},
          reported_by = ${reported_by || null},
          status = ${status || 'Open'},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${parsedId}
      RETURNING id, title, description, incident_type, severity, location, reported_by, status, created_at
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating incident:', error);
    return NextResponse.json({ error: 'Failed to update incident' }, { status: 500 });
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
      DELETE FROM incidents WHERE id = ${parsedId} RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting incident:', error);
    return NextResponse.json({ error: 'Failed to delete incident' }, { status: 500 });
  }
}
