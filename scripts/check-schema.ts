import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://neondb_owner:npg_0rM3xVZWLFkz@ep-lingering-wildflower-za2unq8z-pooler.c-2.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
});

async function main() {
  const client = await pool.connect();
  try {
    const users = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position`);
    console.log('USERS COLUMNS:', users.rows.map((c:any)=>c.column_name).join(', '));

    const cats = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='visitor_categories' ORDER BY ordinal_position`);
    console.log('VISITOR_CATEGORIES COLUMNS:', cats.rows.map((c:any)=>c.column_name).join(', '));

    // Sample users data
    const sample = await client.query(`SELECT id, name, role, shift, is_active FROM users LIMIT 10`);
    console.log('SAMPLE USERS:');
    sample.rows.forEach((u:any) => console.log(' ', JSON.stringify(u)));

    // Sample visitor_categories
    const vcSample = await client.query(`SELECT * FROM visitor_categories LIMIT 10`);
    console.log('SAMPLE VISITOR_CATEGORIES:');
    vcSample.rows.forEach((v:any) => console.log(' ', JSON.stringify(v)));
  } finally {
    client.release();
    await pool.end();
  }
}
main().then(()=>process.exit(0)).catch(e=>{console.error('ERR:',e.message);process.exit(1);});
