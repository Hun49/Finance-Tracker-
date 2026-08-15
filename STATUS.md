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

- Start DB: `docker start finance-postgres` (or use Neon URL in `backend/.env`)
- From project root: `npm run dev` → frontend `:3000`, backend `:4000`
- Backend reads `.env`; frontend reads `.env.local` (`NEXT_PUBLIC_API_URL` blank = auto-target same host :4000)

## Deployment

- Repo: `github.com/Hun49/Finance-Tracker-` (secrets excluded via .gitignore).
- Backend deploy: Vercel, Root Directory `backend`, preset `Service`, Build `npx prisma generate`.
  - Env: `DATABASE_URL` (Neon pooled), `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `NODE_ENV=production`.
- Frontend deploy: Vercel, Root Directory `frontend`, preset `Next.js`.
  - Env: `NEXT_PUBLIC_API_URL` = backend URL + `/api`.
- Render was skipped (requires card). Two separate Vercel projects is the plan.

## Next steps

1. Press Deploy on Vercel (backend), then paste the `.vercel.app` URL here.
2. Deploy frontend, point `NEXT_PUBLIC_API_URL` at backend.
3. Set `FRONTEND_URL` on backend to frontend URL.
4. Resend email (verification codes) via a domain.
5. Ongoing: security/UX/performance polish.