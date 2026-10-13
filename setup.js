// Creates the tables and, if they are empty, loads starter content.
// Usage:  npm run db:setup     (safe to run repeatedly)
//         npm run db:reset     (drops all tables first, then reloads)
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../db');
const seed = require('./seed-data');

const TABLES = ['messages', 'skills', 'projects', 'profile'];

async function isEmpty(client, table) {
  const { rows } = await client.query(`SELECT COUNT(*)::int AS n FROM ${table}`);
  return rows[0].n === 0;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
  }

  const reset = process.argv.includes('--reset');
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    if (reset) {
      for (const t of TABLES) await client.query(`DROP TABLE IF EXISTS ${t} CASCADE`);
      console.log('Dropped existing tables.');
    }

    await client.query(schema);

    if (await isEmpty(client, 'profile')) {
      const p = seed.profile;
      await client.query(
        `INSERT INTO profile (id, name, title, tagline, bio, email, github_url, linkedin_url)
         VALUES (1, $1, $2, $3, $4, $5, $6, $7)`,
        [p.name, p.title, p.tagline, p.bio, p.email, p.github_url, p.linkedin_url]
      );
      console.log('Seeded profile.');
    }

    if (await isEmpty(client, 'projects')) {
      for (const [i, p] of seed.projects.entries()) {
        await client.query(
          `INSERT INTO projects (title, description, tech, github_url, live_url, featured, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [p.title, p.description, p.tech, p.github_url, p.live_url, p.featured, i]
        );
      }
      console.log(`Seeded ${seed.projects.length} projects.`);
    }

    if (await isEmpty(client, 'skills')) {
      for (const [i, s] of seed.skills.entries()) {
        await client.query(
          `INSERT INTO skills (name, category, level, sort_order)
           VALUES ($1, $2, $3, $4) ON CONFLICT (name) DO NOTHING`,
          [s.name, s.category, s.level, i]
        );
      }
      console.log(`Seeded ${seed.skills.length} skills.`);
    }

    await client.query('COMMIT');
    console.log('Database ready.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Database setup failed:', err.message);
  process.exit(1);
});
