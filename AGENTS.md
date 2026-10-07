# Project Instructions

## Product
Job Hunting OS is a small SaaS shell for a Google Sheets-based job tracker.

Current MVP scope:
- Google login with Supabase Auth.
- Protected dashboard.
- FREE, PRO, VIP account status.
- Daily quota display.
- A safe test endpoint that records usage only.
- Manual-payment billing page.

Do not build:
- Payments or webhooks.
- Google Drive/Sheets OAuth.
- Zapi or Gemini integration.
- Scraping implementation.
- Email sending.
- Admin dashboard.
- Multi-tenant Google Sheet synchronization.
- Background jobs, queues, Redis, Prisma, tRPC, Zustand, Redux, shadcn installation, or other infrastructure.

## Stack
- Next.js App Router.
- TypeScript with strict mode.
- Tailwind CSS.
- Supabase Auth and Postgres.
- Vercel deployment.
- GitHub private repository.

## Security
- Never expose server-only secrets in client code.
- Never use SUPABASE_SERVICE_ROLE_KEY in browser code.
- Do not use `any`.
- Do not disable TypeScript, lint, or build checks.
- All quota mutations must call the `consume_usage` Supabase RPC.
- The frontend must not write plan, paid_until, or approved_at.
- Do not put payment approval controls in the user dashboard.

## Routes
- `/` redirects authenticated users to `/dashboard`; otherwise to `/login`.
- `/login` has Google login.
- `/auth/callback` exchanges OAuth code for session.
- `/dashboard` shows account and quota state.
- `/billing` explains manual payment and current plan.
- `/api/usage/consume` is protected and validates action values server-side.

## UI
- Indonesian UI copy.
- Dark, minimal, responsive.
- No animations unless useful.
- Clear empty, loading, and error states.
- Keep components small and readable.

## Done criteria
- `npm run lint` succeeds.
- `npm run build` succeeds.
- Login-protected routes redirect correctly.
- Dashboard loads the signed-in user's profile and daily usage.
- Test usage buttons call the protected API and respect quota.
- No secret is committed.
