import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const searchQuery = searchParams.get('q') || '';
    const filterStatus = searchParams.get('status') || 'ALL';
    const filterSource = searchParams.get('source') || 'ALL';
    const filterPreset = searchParams.get('preset') || 'ALL';
    const searchByCode = searchParams.get('searchByCode') === 'true';
    const sortBy = searchParams.get('sortBy') || 'registration_date';
    const sortOrder = searchParams.get('sortOrder') || 'DESC';

    // Build the WHERE clause conditions
    const conditions = ["event_id = (SELECT id FROM events WHERE status = 'ACTIVE' LIMIT 1)"];
    const params: any[] = [];
    let paramIndex = 1;

    // Handle filter presets
    if (filterPreset === 'TODAY') {
      conditions.push(`DATE(registration_date) = CURRENT_DATE`);
    } else if (filterPreset === 'CHECKED_IN') {
      conditions.push(`check_in_status = 'CHECKED_IN'`);
    } else if (filterPreset === 'NOT_CHECKED_IN') {
      conditions.push(`check_in_status = 'NOT_CHECKED_IN'`);
    }

    // Only apply individual filters if no preset is selected
    if (filterPreset === 'ALL') {
      if (searchQuery) {
        const searchTerm = `%${searchQuery.toLowerCase()}%`;
        if (searchByCode) {
          conditions.push(`LOWER(registration_code) LIKE $${paramIndex}`);
        } else {
          conditions.push(`(LOWER(registration_code) LIKE $${paramIndex} OR LOWER(full_name) LIKE $${paramIndex} OR LOWER(organisation) LIKE $${paramIndex})`);
        }
        params.push(searchTerm);
        paramIndex++;
      }

      if (filterStatus !== 'ALL') {
        conditions.push(`check_in_status = $${paramIndex}`);
        params.push(filterStatus);
        paramIndex++;
      }

      if (filterSource !== 'ALL') {
        conditions.push(`registration_source = $${paramIndex}`);
        params.push(filterSource);
        paramIndex++;
      }
    } else if (searchQuery) {
      // Allow search with preset
      const searchTerm = `%${searchQuery.toLowerCase()}%`;
      if (searchByCode) {
        conditions.push(`LOWER(registration_code) LIKE $${paramIndex}`);
      } else {
        conditions.push(`(LOWER(registration_code) LIKE $${paramIndex} OR LOWER(full_name) LIKE $${paramIndex} OR LOWER(organisation) LIKE $${paramIndex})`);
      }
      params.push(searchTerm);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate and set sort column
    const validSortColumns = ['registration_code', 'full_name', 'organisation', 'registration_date'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'registration_date';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    // Build the full query
    const query = `
      SELECT 
        id,
        registration_code,
        full_name,
        organisation,
        position,
        registration_date,
        check_in_status,
        check_in_date,
        registration_source
      FROM participants
      ${whereClause}
      ORDER BY ${sortColumn} ${order}
    `;

    const result = await pool.query(query, params);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registrations' },
      { status: 500 }
    );
  }
}
