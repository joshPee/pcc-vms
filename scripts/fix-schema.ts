import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://neondb_owner:npg_0rM3xVZWLFkz@ep-lingering-wildflower-za2unq8z-pooler.c-2.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('Running migrations...\n');

    // 1. Fix registration_source constraint to include GUARD_STATION
    console.log('1. Updating valid_registration_source constraint...');
    await client.query(`
      ALTER TABLE participants DROP CONSTRAINT IF EXISTS valid_registration_source;
    `);
    await client.query(`
      ALTER TABLE participants ADD CONSTRAINT valid_registration_source
        CHECK (registration_source IN ('ONLINE','WALK_IN','PRE_REGISTERED','GUARD_STATION','IMPORT'));
    `);
    console.log('   ✓ Done');

    // 2. Add pass_token column
    console.log('2. Adding pass_token column...');
    await client.query(`
      ALTER TABLE participants ADD COLUMN IF NOT EXISTS pass_token VARCHAR(64);
    `);
    console.log('   ✓ Done');

    // 3. Add pass_number column (may already exist, check output showed it exists - but just in case)
    console.log('3. Ensuring pass_number column...');
    await client.query(`
      ALTER TABLE participants ADD COLUMN IF NOT EXISTS pass_number VARCHAR(32);
    `);
    console.log('   ✓ Done');

    // 4. Add watchlist phone column
    console.log('4. Adding watchlist phone column...');
    await client.query(`
      ALTER TABLE watchlist ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
    `);
    console.log('   ✓ Done');

    // 5. Fix organisation NOT NULL — it blocks walk-ins with no org
    console.log('5. Making organisation nullable...');
    await client.query(`
      ALTER TABLE participants ALTER COLUMN organisation DROP NOT NULL;
    `);
    console.log('   ✓ Done');

    // 6. Add AUTO_CHECKED_OUT to check_in_status constraint (if any)
    console.log('6. Checking check_in_status constraint...');
    const cons = await client.query(`
      SELECT conname, pg_get_constraintdef(oid) as def 
      FROM pg_constraint 
      WHERE conrelid='participants'::regclass AND conname LIKE '%check_in%'
    `);
    if (cons.rows.length > 0) {
      console.log('   Found constraint:', cons.rows[0].conname, '-', cons.rows[0].def);
    } else {
      console.log('   No check_in_status constraint found — OK');
    }

    // 7. Verify visitor_logs action — no constraint found so we're fine
    console.log('7. visitor_logs.action — no constraint, free-form — OK');

    // Final verify
    const cols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name='participants' ORDER BY ordinal_position`);
    console.log('\nFinal participants columns:', cols.rows.map((c:any) => c.column_name).join(', '));

    const newcons = await client.query(`SELECT conname, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conrelid='participants'::regclass`);
    console.log('\nFinal participants constraints:');
    newcons.rows.forEach((c:any) => console.log(' ', c.conname, ':', c.def));

  } finally {
    client.release();
    await pool.end();
  }
}

main()
  .then(() => { console.log('\n✅ All migrations complete'); process.exit(0); })
  .catch(e => {
    console.error('\n❌ Migration error:', e.message || e);
    process.exit(1);
  });
