# Finance Tracker — Status

_Last updated: this session_

## What is built

- Next.js frontend (`frontend/`) + Express/Prisma backend (`backend/`).
- Database: Neon Postgres (production) — migrated and seeded.
- Auth: register → 6-digit email code → login, JWT access/refresh.
- Modules: income, expenses, subscriptions, debts (+payments), monthly planner, reports (daily/weekly/monthly/yearly/custom).
- Multi-currency auto-conversion at entry.
- Gemini AI assistant at `/ai` (backend `POST /api/ai/chat`), wired with API key.
- Edit UI on income/expenses/subscriptions/debts; confirm-before-delete.
- Backend rate limiting (auth / API / AI).

## Demo account

- Email: `demo@finance.app`
- Password: `demopassword123`

## Local run

- From project root: `npm run dev` → frontend `:3000`, backend `:4000`.
- Backend reads `.env` (Neon pooled URL); frontend reads `.env.local`.

## Deployment (Vercel, live)

- Repo: `github.com/Hun49/Finance-Tracker-` (secrets excluded via .gitignore). `STATUS.md` included.
- **Frontend (LIVE):** `https://finance-tracker-dem.vercel.app`
  - Root Directory `frontend`, preset Next.js, env `NEXT_PUBLIC_API_URL`.
- **Backend (DEPLOYED, CRASHING → needs redeploy):** `https://finance-tracker-api-pied.vercel.app`
  - Root Directory `backend`, preset Service, Build `npx prisma generate`.
  - Crash cause fixed: `@prisma/adapter-pg` was v7 vs `@prisma/client` v6 → pinned adapter to `6.19.3`, pushed as `20d9cf0`, verified locally (health + login OK).
  - Env: `DATABASE_URL` (Neon pooled), `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `NODE_ENV=production`.
  - **Must add now:** `FRONTEND_URL = https://finance-tracker-dem.vercel.app` (CORS) then Redeploy.

## Next steps

1. Add `FRONTEND_URL` env var to backend on Vercel → Redeploy (`20d9cf0`). ← IN PROGRESS
2. Re-test live register/login; confirm account creation works.
3. Resend email (verification codes) via a domain.
4. Ongoing: security/UX/performance polish.