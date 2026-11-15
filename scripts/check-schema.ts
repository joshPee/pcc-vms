import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://neondb_owner:npg_0rM3xVZWLFkz@ep-lingering-wildflower-za2unq8z-pooler.c-2.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
});

async function main() {
  const client = await pool.connect();
  try {
    // Check columns on participants table
    const cols = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='participants' ORDER BY ordinal_position`);
    console.log('PARTICIPANTS COLUMNS:');
    cols.rows.forEach((c: any) => console.log(' ', c.column_name, ':', c.data_type));

    // Check constraints on participants
    const cons = await client.query(`SELECT conname, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conrelid='participants'::regclass`);
    console.log('\nPARTICIPANTS CONSTRAINTS:');
    cons.rows.forEach((c: any) => console.log(' ', c.conname, ':', c.def));

    // Check visitor_logs constraints
    const lcons = await client.query(`SELECT conname, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conrelid='visitor_logs'::regclass`);
    console.log('\nVISITOR_LOGS CONSTRAINTS:');
    lcons.rows.forEach((c: any) => console.log(' ', c.conname, ':', c.def));

    // Check watchlist columns
    const wcols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name='watchlist' ORDER BY ordinal_position`);
    console.log('\nWATCHLIST COLUMNS:', wcols.rows.map((c: any) => c.column_name).join(', '));

  } finally {
    client.release();
    await pool.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('ERROR:', e.message || e);
    process.exit(1);
  });
