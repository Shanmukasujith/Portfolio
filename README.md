# Personal Portfolio Website (Full-Stack)

| Layer | Technology | Where |
|---|---|---|
| Frontend | HTML, CSS, JavaScript | `public/` |
| Backend | Node.js + Express (runs as a Vercel serverless function) | `lib/app.js`, `routes/api.js`, `api/index.js` |
| Database | PostgreSQL on Supabase | `db.js`, `db/schema.sql`, `db/setup.js` |
| Hosting | Vercel | `vercel.json` |

## How it works

1. Vercel serves `public/` (the website) from its CDN.
2. Requests to `/api/...` are rewritten to `api/index.js`, which runs the Express app.
3. Express queries your Supabase Postgres database and returns JSON.
4. The contact form sends `POST /api/contact`, which saves a row in `messages`.

## 1. Create the Supabase database

1. Create a project at supabase.com and save the **database password**.
2. Click **Connect** at the top of the project and copy the **Transaction pooler** connection string (port 6543). Replace `[YOUR-PASSWORD]` with your password. If your password has special characters (`@ # / : ?`), URL-encode them.
3. Create the tables and starter content, using either option:
   - **Terminal:** copy `.env.example` to `.env`, paste the string into `DATABASE_URL`, then run `npm install` and `npm run db:setup`.
   - **No terminal:** open **SQL Editor** in Supabase and run the contents of `db/schema.sql`. The site works with empty tables, but you'd need to add data yourself.

## 2. Deploy to Vercel

1. Push this project to GitHub (files at the repo's top level).
2. On vercel.com choose **Add New → Project** and import the repo.
3. Leave **Framework Preset** as "Other" and leave the build settings alone.
4. Open **Environment Variables** and add:
   - `DATABASE_URL`: the Supabase Transaction pooler string
   - `ADMIN_KEY`: a long random string (used for the admin API)
5. Click **Deploy**.
6. Check `https://YOUR-APP.vercel.app/api/health`. It should return `{"status":"ok"}`.

Changing an environment variable only takes effect after you **Redeploy**.

## Run locally

```bash
npm install
cp .env.example .env     # fill in DATABASE_URL and ADMIN_KEY
npm run db:setup
npm start                # http://localhost:3000
```

## Make it yours

1. Edit `db/seed-data.js` (name, bio, email, links, projects, skills).
2. Run `npm run db:reset` on your computer with `DATABASE_URL` pointing at Supabase.
   **This deletes all rows, including contact messages.**

Or edit rows directly in the Supabase **Table Editor**, which needs no code.

## API

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Server and database check |
| GET | `/api/profile` | Your profile |
| GET | `/api/projects` | All projects |
| GET | `/api/skills` | All skills |
| POST | `/api/contact` | Save a message |
| POST | `/api/projects` | Add a project (admin) |
| DELETE | `/api/projects/:id` | Delete a project (admin) |
| GET | `/api/messages` | Read messages (admin) |

Admin routes need the header `x-admin-key: <ADMIN_KEY>`. If `ADMIN_KEY` is not set they are disabled. You can also read messages in the Supabase Table Editor.

## Security notes

- All SQL is parameterised; page content is written with `textContent`, never `innerHTML`.
- Row Level Security is enabled on every table with no policies, so Supabase's own public REST API cannot read or write them. Only this server (using your private `DATABASE_URL`) can.
- Never put `DATABASE_URL` or `ADMIN_KEY` in the code or the GitHub repo.
- Contact spam protection: a hidden honeypot field, a per-instance rate limit, and a database-backed cap of 20 messages per 15 minutes.

## Troubleshooting

- **`/api/...` returns 404 on Vercel:** `vercel.json` and the `api/` folder must be at the repo's top level.
- **`/api/health` returns 500:** check Vercel **Logs**. Usually `DATABASE_URL` is missing, has a wrong password, or you redeployed nothing after adding it.
- **`ENOTFOUND` or timeouts:** use the Transaction pooler string, not the "Direct connection" one (that one needs IPv6).
- **`password authentication failed`:** wrong or un-encoded password; you can reset it in Supabase under Project Settings → Database.
- **"Profile not found":** the tables are empty. Run `npm run db:setup`.
