# Job Hunting OS - Web Application

MVP SaaS shell for Job Hunting OS, providing authentication, membership management, and usage quota tracking.

## Tech Stack

- **Next.js 16** with App Router
- **TypeScript** (strict mode)
- **Tailwind CSS 4**
- **Supabase** (Auth + Postgres)
- **Vercel** (deployment)

## Features

- Google OAuth authentication via Supabase
- FREE, PRO, and VIP membership plans (plus internal ADMIN)
- Daily usage quota tracking (AI actions + scraping)
- Manual billing approval workflow
- Protected dashboard and billing pages

## Prerequisites

1. Node.js 18+ and npm
2. A Supabase account (free tier works)
3. A Google Cloud Console project for OAuth

## Local Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd job-hunting-os-web
npm install
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration in `supabase/migrations/001_initial.sql`
3. Go to **Authentication > Providers > Google**
   - Enable Google provider
   - Add your Google OAuth Client ID and Client Secret (see step 3)
4. Go to **Authentication > URL Configuration**
   - Add callback URL: `http://localhost:3000/auth/callback`
   - Set Site URL to: `http://localhost:3000`

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select a project
3. Enable **Google+ API**
4. Go to **APIs & Services > Credentials**
5. Create **OAuth 2.0 Client ID** (Web application)
6. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback`
   - `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback`
7. Copy Client ID and Client Secret to Supabase (step 2.3)

### 4. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_anon_key
```

Find these values in Supabase Project Settings > API.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Testing Locally

1. Sign in with Google
2. A FREE account is created automatically
3. Go to `/dashboard`
4. Test quota buttons:
   - AI actions: 3/day total (AI Extract + AI Generate combined)
   - Scraping: 1/day (only one portal per day for FREE users)
5. Go to `/billing` to see manual payment instructions

## Manual Approval (Admin)

To upgrade a user to PRO or VIP:

1. Open Supabase Dashboard
2. Go to **Table Editor > profiles**
3. Find the user by email
4. Edit the row:
   - `plan`: change to `PRO` or `VIP`
   - `paid_until`: set to subscription end date (e.g., `2026-11-03T00:00:00Z`)
   - `approved_at`: set to current timestamp
5. Save

The user will see their new plan status on next dashboard load.

## Vercel Deployment

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/job-hunting-os-web.git
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Deploy

### 3. Update Supabase Auth URLs

After deployment, add your production URL to Supabase:

1. Go to **Authentication > URL Configuration**
2. Add callback URL: `https://YOUR_VERCEL_PROJECT.vercel.app/auth/callback`
3. Update Site URL to: `https://YOUR_VERCEL_PROJECT.vercel.app`

### 4. Update Google OAuth

Add production redirect URI to Google Cloud Console:
- `https://YOUR_VERCEL_PROJECT.vercel.app/auth/callback`

## Project Structure

```
job-hunting-os-web/
├── app/
│   ├── (auth)/login/          # Login page
│   ├── (dashboard)/           # Protected dashboard routes
│   │   ├── dashboard/         # Main dashboard
│   │   └── billing/           # Billing page
│   ├── api/usage/consume/     # Usage quota API
│   ├── auth/callback/         # OAuth callback
│   └── page.tsx               # Home redirect
├── components/
│   ├── auth/                  # Authentication components
│   ├── dashboard/             # Dashboard components
│   └── ui/                    # Base UI components
├── lib/
│   ├── auth/                  # Auth helpers
│   ├── quota/                 # Quota logic
│   └── supabase/              # Supabase clients
├── supabase/migrations/       # Database schema
└── middleware.ts              # Auth middleware
```

## Business Rules

### FREE Plan
- AI quota: 3 uses/day (AI_EXTRACT + AI_GENERATE combined)
- Scraping quota: 1 use/day
- Only one scraping portal allowed per day
- Auto-assigned on first login

### PRO Plan (Rp 49.000/bulan atau Rp 129.000/3 bulan)
- AI quota: 30 uses/day
- Scraping quota: 10 uses/day
- Multiple portals allowed per day
- Manual approval by admin
- Valid until `paid_until` date
- Auto-downgrades to FREE when expired

### VIP Plan (Rp 99.000/bulan atau Rp 249.000/3 bulan)
- AI quota: 100 uses/day
- Scraping quota: 25 uses/day
- Multiple portals allowed per day
- Manual approval by admin
- Valid until `paid_until` date
- Auto-downgrades to FREE when expired

### ADMIN (internal only)
- Unlimited AI & scraping quota
- Not exposed to the public billing UI

## Security Notes

- Never commit `.env.local`
- Never expose `SUPABASE_SERVICE_ROLE_KEY` (not used in this app)
- All quota mutations go through `consume_usage` RPC
- Users cannot write their own `plan`, `paid_until`, or `approved_at`

## Development Commands

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Not Included in MVP

This first build does NOT include:
- Payment gateway integration
- Google Sheets/Drive OAuth
- Zapi or Gemini API integration
- Actual scraping implementation
- Email notifications
- Admin dashboard UI
- Webhooks or background jobs

These will be added in future phases.

## Project Log / Changelog

### 2026-10-07 — Plan Tier Expansion & UI/Visibility Enhancements

**Plan Tier & Role Updates (FREE, PRO, VIP, ADMIN):**
- Updated plan structures & quotas: FREE (1 scrape, 3 AI), PRO (10 scrape, 30 AI), VIP (25 scrape, 100 AI), ADMIN (unlimited).
- Database migrations (`012_add_plan_enum_values.sql` & `013_update_plan_constraints_and_rpc.sql`) to safely update `plan_type` enum, migrate existing `PAID` users to `PRO`/`FREE`, update constraints, and rewrite `consume_usage` RPC.
- Redesigned `/billing` page with 1-month and 3-month options for PRO (Rp 49.000 / Rp 129.000) and VIP (Rp 99.000 / Rp 249.000) with dynamic WhatsApp confirmation links.

**Job List UI Layout & Contrast Improvements:**
- Reorganized Job Card header: tags (portal source & match score) and action buttons (Status, Match, Cover Letter, Email, URL, Delete) are now placed in a clean, horizontal flex-wrap bar above the job details.
- Improved text contrast across the application:
  - Action buttons "Surat" & "Email" updated to high-contrast `text-emerald-700` with light hover state on white background.
  - Labels in Settings and Profile forms upgraded from low-contrast `zinc-400`/`zinc-500` to `zinc-600`.
  - Copy button in modals styled with high visibility font & ring accent.

### 2026-10-06 — Pepelsbey Light Design & Smart Quick-Paste (Phase 1)

**Design System Migration:**
- Applied Pepelsbey light design system: Background `#FFFFFF`, Text `#0C0B1E`, Accent `#C1EF7B`, Muted/Tint `#F1F0FF`
- Border radius standardized to `rounded-sm` (2px) for sharp, minimal look
- Removed dark mode support (Pepelsbey is light-only); disabled theme toggle in headers/settings

**Quick Paste Feature (Phase 1):**
- Added Smart Quick-Paste modal: accepts text/caption + optional image + optional source URL
- Implemented `/api/jobs/parse` endpoint using Gemini 1.5 Flash Vision for OCR extraction
- AI extracts: Position, Company, Location, Type, Salary, Description + auto-detects contacts (Email, WhatsApp, Apply Link)
- Added database migration `003_add_quick_paste_fields.sql` for `contact_email`, `contact_whatsapp`, `apply_url`, `source_url`
- Created `/api/jobs/save` to persist extracted jobs with new contact fields

**UI/UX Refinements (Latest):**
- Compact horizontal action bar: `+ Quick Paste`, `LinkedIn`, `Jobstreet` inline with no vertical gap
- Removed scrape info text ("Pengambilan data 24 jam...") for cleaner header
- Fixed font contrast: buttons use `#0C0B1E` (ink navy) on white with bold weights; Quick Paste primary uses `#C1EF7B` on `#0C0B1E`
- Native `<button>` elements in modals to avoid Button component variant conflicts
- All placeholders upgraded to `text-zinc-500` for readability; labels use `font-semibold text-zinc-800`

### 2026-10-05 — MVP Core Complete
- Google OAuth login with Supabase Auth
- Protected dashboard with FREE/PRO/VIP plan display
- Daily quota tracking via `consume_usage` RPC
- Manual billing page with payment instructions
- TypeScript strict mode, lint & build passing

## License

Private - All rights reserved

## Support

For issues or questions, contact the project owner.
