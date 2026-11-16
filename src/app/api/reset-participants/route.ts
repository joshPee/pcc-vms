import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { requireRole } from '@/lib/require-role';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export type ClearFilterRange = 'all' | 'older_than_week' | 'older_than_month' | 'older_than_year';

export async function POST(request: NextRequest) {
  const auth = await requireRole('admin');
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const range: ClearFilterRange = body.range || 'all';

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      let dateCondition = '';
      let rangeLabel = 'All visitor records';

      if (range === 'older_than_week') {
        dateCondition = "WHERE created_at < NOW() - INTERVAL '7 days'";
        rangeLabel = 'Records older than 1 week';
      } else if (range === 'older_than_month') {
        dateCondition = "WHERE created_at < NOW() - INTERVAL '30 days'";
        rangeLabel = 'Records older than 1 month (30 days)';
      } else if (range === 'older_than_year') {
        dateCondition = "WHERE created_at < NOW() - INTERVAL '365 days'";
        rangeLabel = 'Records older than 1 year (365 days)';
      }

      let deletedParticipantsCount = 0;

      if (range === 'all') {
        // Complete wipe of all visitor activity
        await client.query('DELETE FROM check_ins');
        await client.query('DELETE FROM check_outs');
        // Delete logs that reference participants
        await client.query('DELETE FROM visitor_logs WHERE participant_id IS NOT NULL');
        const res = await client.query('DELETE FROM participants RETURNING id');
        deletedParticipantsCount = res.rowCount || 0;
      } else {
        // Range-based deletion: delete cascading records for target participants
        const targetIdsRes = await client.query(
          `SELECT id FROM participants ${dateCondition}`
        );
        const targetIds = targetIdsRes.rows.map((r: any) => r.id);

        if (targetIds.length > 0) {
          await client.query(
            `DELETE FROM check_ins WHERE participant_id = ANY($1::int[])`,
            [targetIds]
          );
          await client.query(
            `DELETE FROM check_outs WHERE participant_id = ANY($1::int[])`,
            [targetIds]
          );
          await client.query(
            `DELETE FROM visitor_logs WHERE participant_id = ANY($1::int[])`,
            [targetIds]
          );
          const deleteRes = await client.query(
            `DELETE FROM participants WHERE id = ANY($1::int[]) RETURNING id`,
            [targetIds]
          );
          deletedParticipantsCount = deleteRes.rowCount || 0;
        }
      }

      // Record administrative audit trail entry
      const adminUserId = auth.context.user?.id ? Number(auth.context.user.id) : null;
      const clientIp = request.headers.get('x-forwarded-for') || '127.0.0.1';
      await client.query(
        `INSERT INTO visitor_logs (participant_id, action, user_id, details, ip_address)
         VALUES (NULL, 'PARTICIPANTS_PURGED', $1, $2, $3)`,
        [
          adminUserId,
          `Administrator purged visitor data with filter "${range}" (${rangeLabel}). Total deleted: ${deletedParticipantsCount} participant(s).`,
          clientIp,
        ]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        range,
        deletedCount: deletedParticipantsCount,
        message: `${rangeLabel} cleared successfully. Deleted ${deletedParticipantsCount} participant record(s).`,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error clearing participants:', error);
    return NextResponse.json(
      { error: 'Failed to clear visitor records', details: String(error) },
      { status: 500 }
    );
  }
}
