# RuralRise

Local Opportunity, Local Prosperity — a full-stack platform connecting rural
youth in India with opportunities, training, government schemes and local
markets.

- **Backend**: Node + Express + TypeScript, Prisma ORM, PostgreSQL, JWT auth
- **Frontend**: React + Vite + TypeScript + Tailwind CSS

## Quick start (local dev)

```bash
npm install           # installs root tooling (concurrently)
npm run setup         # installs backend & frontend deps

npm run db:embedded   # starts a bundled PostgreSQL (no install needed)
npm run db:migrate    # applies migrations
npm run db:seed       # seeds demo data

npm run dev           # API on :4000, web on :5173
```

Demo logins (password `Password123!`):
`youth@demo.ruralrise.in` · `employer@demo.ruralrise.in` · `admin@demo.ruralrise.in`

If you have your own PostgreSQL, skip `db:embedded` and point
`DATABASE_URL` at it in `backend/.env`.

## Scripts

| Script                                                     | What it does                                             |
| ---------------------------------------------------------- | -------------------------------------------------------- |
| `npm run dev`                                              | Runs API + web in dev mode together                      |
| `npm run build`                                            | Builds backend (`dist/`) and frontend (`frontend/dist/`) |
| `npm run start`                                            | Runs the built backend (`node dist/server.js`)           |
| `npm run typecheck`                                        | TypeScript check for both packages                       |
| `npm run test`                                             | Vitest suite (unit + API tests against a live DB)        |
| `npm run db:embedded`                                      | Bundled PostgreSQL, data under `backend/.embedded-db`    |
| `npm run db:migrate` / `db:seed` / `db:reset` / `db:count` | Prisma helpers                                           |

## Configuration (backend/.env)

```
DATABASE_URL=postgresql://user:pass@host:5432/ruralrise
JWT_SECRET=<long random string>          # REQUIRED in production
PORT=4000
CORS_ORIGINS=https://your-frontend.example.com
NODE_ENV=production
# Optional — serve the built frontend from the API process:
FRONTEND_DIST=../frontend/dist           # default resolves to ../../frontend/dist
SERVE_FRONTEND=false                     # set to false if the frontend is hosted separately
```

Generate a secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

## Deploying

### Option A — single service (simplest)

Build both packages, ship the repo to one host (Render, Railway, Fly.io, a VPS…)
and run:

```bash
npm run setup
npm run build
npm run start            # serves the API and the built frontend on one port
```

Point a managed Postgres at `DATABASE_URL`, then run migrations once:

```bash
npm run db:migrate && npm run db:seed
```

Example for [Render](https://render.com):

- **Web Service**: build `npm run setup && npm run build`, start `npm run start`.
- **Postgres**: create an instance, copy its internal URL into `DATABASE_URL`.
- Add `JWT_SECRET`, `NODE_ENV=production`, `CORS_ORIGINS` in the dashboard.

### Option B — separate frontend host (Vercel/Netlify)

- Frontend: deploy `frontend/`, build command `npm run build`, output
  `dist/`. Set `VITE_API_URL` to your API base URL (e.g.
  `https://api.example.com/api`) at build time.
- Backend: deploy `backend/` (`npm run build`, `npm run start`) and set
  `SERVE_FRONTEND=false` plus `CORS_ORIGINS` to the frontend origin.

## Health check

`GET /api/health` → `{"ok":true,"service":"RuralRise API","database":"connected"}`
