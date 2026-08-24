import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const visitorType = searchParams.get('visitorType');

    let query = `
      SELECT 
        p.id,
        p.full_name,
        p.organisation,
        p.position,
        p.visitor_type,
        p.visit_purpose,
        p.check_in_date,
        p.check_out_date,
        EXTRACT(EPOCH FROM (p.check_out_date - p.check_in_date))/3600 as visit_duration_hours,
        u_in.name as checked_in_by,
        u_out.name as checked_out_by,
        co.notes as check_out_notes
      FROM participants p
      LEFT JOIN check_ins ci ON p.id = ci.participant_id
      LEFT JOIN users u_in ON ci.user_id = u_in.id
      LEFT JOIN check_outs co ON p.id = co.participant_id
      LEFT JOIN users u_out ON co.user_id = u_out.id
      WHERE p.check_in_status = 'CHECKED_OUT'
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (startDate) {
      query += ` AND p.check_in_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND p.check_in_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    if (visitorType && visitorType !== 'ALL') {
      query += ` AND p.visitor_type = $${paramIndex}`;
      params.push(visitorType);
      paramIndex++;
    }

    query += ' ORDER BY p.check_in_date DESC';

    const result = await pool.query(query, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching visitor history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch visitor history' },
      { status: 500 }
    );
  }
}
