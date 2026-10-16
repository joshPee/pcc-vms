import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    if (!sql) {
      return NextResponse.json([]);
    }

    const incidents = await sql`
      SELECT id, title, description, incident_type, severity, location, reported_by, status, created_at, updated_at
      FROM incidents
      ORDER BY created_at DESC
    `;
    return NextResponse.json(incidents);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incidents' },
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
    const { title, description, incident_type, severity, location, reported_by, status } = body;

    if (!title || !incident_type) {
      return NextResponse.json(
        { error: 'Title and incident type are required' },
        { status: 400 }
      );
    }

    const reporter = reported_by || session.user.name || session.user.email;

    const result = await sql`
      INSERT INTO incidents (title, description, incident_type, severity, location, reported_by, status, created_by)
      VALUES (
        ${title},
        ${description || null},
        ${incident_type},
        ${severity || 'Low'},
        ${location || null},
        ${reporter},
        ${status || 'Open'},
        ${parseInt(session.user.id)}
      )
      RETURNING id, title, description, incident_type, severity, location, reported_by, status, created_at
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating incident:', error);
    return NextResponse.json(
      { error: 'Failed to create incident' },
      { status: 500 }
    );
  }
}
