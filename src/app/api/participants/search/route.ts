import { NextRequest, NextResponse } from 'next/server';
import { pool, sql } from '@/lib/db';
import { findWatchlistMatches } from '@/lib/watchlist-match';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const checkInStatus = searchParams.get('checkInStatus');

    if (!query || query.trim().length < 3) {
      return NextResponse.json([]);
    }

    // Normalize search query while preserving hyphens and alphanumerics
    const rawTrimmed = query.trim();
    const normalizedSearch = query.replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ').trim();
    const searchWords = normalizedSearch.split(' ').filter(word => word.length > 0);
    
    if (searchWords.length === 0) {
      return NextResponse.json([]);
    }

    let sqlQuery = `
      SELECT 
        id,
        registration_code,
        full_name,
        organisation,
        position,
        phone,
        host_name,
        host_department,
        vehicle_registration,
        check_in_status,
        check_in_date,
        registration_source
      FROM participants
      WHERE (
        event_id = (SELECT id FROM events WHERE status = 'ACTIVE' LIMIT 1) 
        OR event_id IS NULL 
        OR check_in_status = 'CHECKED_IN'
      )
    `;

    const params: any[] = [];
    let paramIndex = 1;

    // Build fuzzy search conditions
    const searchConditions = searchWords.map((word) => {
      const paramNum = paramIndex++;
      return `(
        LOWER(registration_code) LIKE LOWER($${paramNum}) OR
        LOWER(REPLACE(registration_code, '-', '')) LIKE LOWER($${paramNum}) OR
        LOWER(full_name) LIKE LOWER($${paramNum}) OR
        LOWER(COALESCE(organisation, '')) LIKE LOWER($${paramNum}) OR
        LOWER(COALESCE(phone, '')) LIKE LOWER($${paramNum}) OR
        LOWER(COALESCE(vehicle_registration, '')) LIKE LOWER($${paramNum})
      )`;
    }).join(' AND ');

    sqlQuery += ` AND (${searchConditions})`;

    // Push parameters for each word first
    searchWords.forEach(word => {
      const searchTerm = `%${word}%`;
      params.push(searchTerm);
    });

    // Filter by check-in status if provided
    if (checkInStatus && checkInStatus !== 'ALL') {
      sqlQuery += ` AND check_in_status = $${paramIndex}`;
      params.push(checkInStatus);
      paramIndex++;
    }

    sqlQuery += ` ORDER BY full_name LIMIT 20`;

    let rows: any[] = [];
    if (pool) {
      const result = await pool.query(sqlQuery, params);
      rows = result.rows;
    } else if (sql) {
      rows = await sql.query(sqlQuery, params);
    }

    return NextResponse.json(rows, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed. Please try again.' },
      { status: 500 }
    );
  }
}
