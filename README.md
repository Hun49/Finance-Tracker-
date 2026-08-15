# Finance Tracker

A full-stack finance tracker for manually entered income, expenses, subscriptions, debts, monthly planning, reports, and later Gemini-powered insights.

## Stack

- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: Express, TypeScript, Prisma
- Database: PostgreSQL, recommended Neon for hosting
- Auth: JWT access tokens, refresh tokens, email verification codes
- Email: Resend
- Currency: real exchange-rate API
- AI: Gemini API after the finance tracker is complete

## Apps

```txt
frontend/  Next.js web app
backend/   Express API and Prisma schema
```

## Development

### 1. Start the database (Docker)

```bash
docker start finance-postgres   # or: docker run --name finance-postgres -e POSTGRES_USER=finance -e POSTGRES_PASSWORD=finance -e POSTGRES_DB=finance_tracker -p 5432:5432 -d postgres:16-alpine
```

### 2. Install dependencies (once)

```bash
cd frontend && npm install
cd ../backend && npm install
```

### 3. Configure environment (once)

```bash
cd backend && cp .env.example .env   # fill in DATABASE_URL, JWT secrets; add RESEND_API_KEY to send real email
cd frontend && cp .env.example .env.local
```

### 4. Create the database schema

```bash
cd backend && npm run prisma:migrate -- --name init
```

### 5. Run both apps

From the project root:

```bash
npm run dev
```

This starts the backend (`http://localhost:4000`) and frontend (`http://localhost:3000`) together. Open http://localhost:3000.

Or run them in two terminals:

```bash
npm run dev:backend    # API on :4000
npm run dev:frontend   # UI on :3000
```

### 6. Developer note

Without a `RESEND_API_KEY`, verification codes are printed to the backend console/log instead of emailed:

```txt
[dev-email] Verification code for you@example.com: 123456
```
