import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://neondb_owner:npg_0rM3xVZWLFkz@ep-lingering-wildflower-za2unq8z-pooler.c-2.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('Ensuring visitor_categories table and default entries...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS visitor_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        overstay_minutes INTEGER DEFAULT 240,
        multi_day BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure columns exist if table was partially created
    await client.query(`
      ALTER TABLE visitor_categories ADD COLUMN IF NOT EXISTS overstay_minutes INTEGER DEFAULT 240;
      ALTER TABLE visitor_categories ADD COLUMN IF NOT EXISTS multi_day BOOLEAN DEFAULT false;
    `);

    // Seed default PCC categories
    await client.query(`
      INSERT INTO visitor_categories (name, description, overstay_minutes, multi_day)
      VALUES
        ('Official', 'Official business or department meetings', 240, false),
        ('Contractor', 'Maintenance, construction and vendors', 480, false),
        ('VIP', 'Dignitaries and executive leadership', 480, false),
        ('Personal', 'Personal visits to staff or residents', 180, false),
        ('Delivery', 'Courier and dispatch deliveries', 60, false),
        ('Guest House', 'Overnight and long-term accommodation residents', 1440, true),
        ('Conference', 'Multi-day retreat and convention delegates', 1440, true)
      ON CONFLICT (name) DO UPDATE SET
        overstay_minutes = EXCLUDED.overstay_minutes,
        multi_day = EXCLUDED.multi_day;
    `);

    const rows = await client.query(`SELECT * FROM visitor_categories ORDER BY id ASC`);
    console.log('Categories initialized:');
    rows.rows.forEach(r => console.log(' ', r.name, r.overstay_minutes, 'min', r.multi_day ? '(multi-day)' : ''));
  } finally {
    client.release();
    await pool.end();
  }
}

main().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
