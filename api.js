const crypto = require('crypto');
const express = require('express');
const rateLimit = require('express-rate-limit');
const pool = require('../db');

const router = express.Router();

// Lets async handlers throw and have Express catch it.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

// ---------- Admin guard ----------
function requireAdmin(req, res, next) {
  const expected = process.env.ADMIN_KEY;
  if (!expected) {
    return res.status(503).json({ error: 'Admin access is not configured on this server.' });
  }
  const provided = Buffer.from(String(req.get('x-admin-key') || ''));
  const wanted = Buffer.from(expected);
  const ok = provided.length === wanted.length && crypto.timingSafeEqual(provided, wanted);
  if (!ok) return res.status(401).json({ error: 'Invalid admin key.' });
  next();
}

// ---------- Public routes ----------
router.get(
  '/health',
  wrap(async (req, res) => {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  })
);

router.get(
  '/profile',
  wrap(async (req, res) => {
    const { rows } = await pool.query(
      'SELECT name, title, tagline, bio, email, github_url, linkedin_url FROM profile WHERE id = 1'
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Profile not found. Run npm run db:setup.' });
    }
    res.json(rows[0]);
  })
);

router.get(
  '/projects',
  wrap(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT id, title, description, tech, github_url, live_url, featured
       FROM projects
       ORDER BY featured DESC, sort_order ASC, id ASC`
    );
    res.json(rows);
  })
);

router.get(
  '/skills',
  wrap(async (req, res) => {
    const { rows } = await pool.query(
      'SELECT id, name, category, level FROM skills ORDER BY sort_order ASC, id ASC'
    );
    res.json(rows);
  })
);

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages from this connection. Please try again in a few minutes.' },
});

router.post(
  '/contact',
  contactLimiter,
  wrap(async (req, res) => {
    const body = req.body || {};

    // Honeypot: real visitors never fill this hidden field. Pretend success to bots.
    if (cleanString(body.website)) return res.status(201).json({ ok: true });

    const name = cleanString(body.name);
    const email = cleanString(body.email);
    const message = cleanString(body.message);

    if (!name || name.length > 100) {
      return res.status(400).json({ error: 'Enter your name (up to 100 characters).' });
    }
    if (!EMAIL_RE.test(email) || email.length > 254) {
      return res.status(400).json({ error: 'Enter a valid email address.' });
    }
    if (message.length < 10 || message.length > 2000) {
      return res.status(400).json({ error: 'Write a message between 10 and 2000 characters.' });
    }

    // The in-memory limiter above only counts per server instance, and serverless hosts
    // run many instances. This database-backed cap protects the whole inbox from floods.
    const recent = await pool.query(
      "SELECT COUNT(*)::int AS n FROM messages WHERE created_at > NOW() - INTERVAL '15 minutes'"
    );
    if (recent.rows[0].n >= 20) {
      return res
        .status(429)
        .json({ error: 'The inbox is busy right now. Please try again in a few minutes.' });
    }

    await pool.query('INSERT INTO messages (name, email, message) VALUES ($1, $2, $3)', [
      name,
      email,
      message,
    ]);
    res.status(201).json({ ok: true });
  })
);

// ---------- Admin routes (send header: x-admin-key) ----------
router.post(
  '/projects',
  requireAdmin,
  wrap(async (req, res) => {
    const body = req.body || {};
    const title = cleanString(body.title);
    const description = cleanString(body.description);
    const githubUrl = cleanString(body.github_url) || null;
    const liveUrl = cleanString(body.live_url) || null;
    const tech = Array.isArray(body.tech)
      ? body.tech.map(cleanString).filter(Boolean).slice(0, 12)
      : [];

    if (!title || title.length > 120) {
      return res.status(400).json({ error: 'title is required (max 120 characters).' });
    }
    if (!description || description.length > 600) {
      return res.status(400).json({ error: 'description is required (max 600 characters).' });
    }
    if ((githubUrl && !isHttpUrl(githubUrl)) || (liveUrl && !isHttpUrl(liveUrl))) {
      return res.status(400).json({ error: 'github_url and live_url must be http(s) URLs.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO projects (title, description, tech, github_url, live_url, featured, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6,
               COALESCE((SELECT MAX(sort_order) + 1 FROM projects), 0))
       RETURNING id, title, description, tech, github_url, live_url, featured`,
      [title, description, tech, githubUrl, liveUrl, body.featured === true]
    );
    res.status(201).json(rows[0]);
  })
);

router.delete(
  '/projects/:id',
  requireAdmin,
  wrap(async (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid id.' });
    const { rowCount } = await pool.query('DELETE FROM projects WHERE id = $1', [id]);
    if (!rowCount) return res.status(404).json({ error: 'Project not found.' });
    res.status(204).end();
  })
);

router.get(
  '/messages',
  requireAdmin,
  wrap(async (req, res) => {
    const { rows } = await pool.query(
      'SELECT id, name, email, message, created_at FROM messages ORDER BY created_at DESC LIMIT 200'
    );
    res.json(rows);
  })
);

module.exports = router;
