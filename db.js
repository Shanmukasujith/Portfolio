const { Pool } = require('pg');

const url = process.env.DATABASE_URL || '';

// Supabase (and most hosted Postgres) requires SSL. Locally it stays off unless the
// URL points at Supabase or DATABASE_SSL=true. Set DATABASE_SSL=false to force it off.
const useSsl =
  process.env.DATABASE_SSL === 'true' ||
  (process.env.DATABASE_SSL !== 'false' &&
    (process.env.NODE_ENV === 'production' || /supabase\.(co|com)/.test(url)));

const pool = new Pool({
  connectionString: url,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  // Serverless: each function instance should hold at most one connection.
  // Supabase's pooler (port 6543) handles the fan-in.
  max: process.env.VERCEL ? 1 : 10,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err.message);
});

module.exports = pool;
