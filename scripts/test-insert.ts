import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://neondb_owner:npg_0rM3xVZWLFkz@ep-lingering-wildflower-za2unq8z-pooler.c-2.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('Testing a registration-like insert...\n');

    const passNumber = 'TEST-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    const passToken = 'testtoken' + Date.now();

    const result = await client.query(`
      INSERT INTO participants (
        registration_code, pass_number, pass_token,
        full_name, phone, location, organisation,
        host_name, host_department, visit_purpose, visitor_type,
        participant_status, registration_status, registration_source,
        approval_status, check_in_status, check_in_date, created_at
      ) VALUES (
        $1, $2, $3,
        'Test Visitor', '0201234567', 'Accra / PCC', NULL,
        'Test Host', 'General', 'Test Visit', 'Official',
        'REGISTERED', 'REGISTERED', 'GUARD_STATION',
        'APPROVED', 'CHECKED_IN', NOW(), NOW()
      ) RETURNING id, pass_number, pass_token
    `, [passNumber, passNumber, passToken]);

    console.log('✅ Insert succeeded!', result.rows[0]);

    // Cleanup
    await client.query(`DELETE FROM participants WHERE id = $1`, [result.rows[0].id]);
    console.log('✅ Cleanup done');

  } finally {
    client.release();
    await pool.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('❌ Test failed:', e.message || e);
    process.exit(1);
  });
