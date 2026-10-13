-- Safe to run repeatedly: every statement is idempotent.

CREATE TABLE IF NOT EXISTS profile (
  id           INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- single-row table
  name         TEXT NOT NULL,
  title        TEXT NOT NULL,
  tagline      TEXT NOT NULL,
  bio          TEXT NOT NULL,
  email        TEXT NOT NULL,
  github_url   TEXT,
  linkedin_url TEXT
);

CREATE TABLE IF NOT EXISTS projects (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  tech        TEXT[] NOT NULL DEFAULT '{}',
  github_url  TEXT,
  live_url    TEXT,
  featured    BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skills (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  category   TEXT NOT NULL,
  level      SMALLINT NOT NULL CHECK (level BETWEEN 1 AND 5),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS messages (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Supabase exposes tables through its own public REST API. Turning on Row Level Security
-- with no policies blocks that route completely. This app connects directly as the
-- database owner, which is not affected by RLS.
ALTER TABLE profile  ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills   ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
