import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const visitorType = searchParams.get('visitorType');

    // Build query parameters
    const conditions = ['p.check_in_date IS NOT NULL'];
    const params: any[] = [];
    let paramIndex = 1;

    if (startDate) {
      conditions.push(`p.check_in_date >= $${paramIndex}`);
      params.push(`${startDate} 00:00:00`);
      paramIndex++;
    }
    
    if (endDate) {
      conditions.push(`p.check_in_date <= $${paramIndex}`);
      params.push(`${endDate} 23:59:59`);
      paramIndex++;
    }

    if (visitorType && visitorType !== 'ALL') {
      conditions.push(`p.visitor_type = $${paramIndex}`);
      params.push(visitorType);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Build the complete query
    const query = `
      SELECT 
        p.id,
        p.registration_code,
        p.full_name,
        p.organisation,
        p.position,
        p.phone,
        COALESCE(p.visitor_type, 'GENERAL') as visitor_type,
        p.check_in_date,
        p.check_out_date,
        p.check_in_status,
        p.registration_source,
        CASE 
          WHEN p.check_out_date IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (p.check_out_date - p.check_in_date))/3600 
          ELSE NULL 
        END as visit_duration_hours,
        u_in.name as checked_in_by,
        u_out.name as checked_out_by,
        co.notes as check_out_notes,
        false as is_recurring
      FROM participants p
      LEFT JOIN check_ins ci ON p.id = ci.participant_id
      LEFT JOIN users u_in ON ci.user_id = u_in.id
      LEFT JOIN check_outs co ON p.id = co.participant_id
      LEFT JOIN users u_out ON co.user_id = u_out.id
      WHERE ${whereClause}
      ORDER BY p.check_in_date DESC
      LIMIT 1000
    `;

    const result = await pool.query(query, params);
    return NextResponse.json(result.rows || []);
  } catch (error) {
    console.error('Visitor history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch visitor history' },
      { status: 500 }
    );
  }
}
