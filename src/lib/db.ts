import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  // During build time, we might not have DATABASE_URL
  // This is acceptable for static pages, but will fail at runtime if not set
  if (process.env.NODE_ENV === 'production') {
    console.warn('DATABASE_URL environment variable is not set');
  }
}

export const sql = databaseUrl ? neon(databaseUrl) : null as any;
