import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  PORTALS,
  type Portal,
  GLINTS_REGION_ALIASES,
  getDeallsCities,
  PORTAL_LABEL,
} from '@/lib/constants/portal-locations';
import { remainingZapiCalls } from '@/lib/quota/zapi-cap';

// Route ini dipanggil oleh Vercel Cron sekali sehari (Hobby Plan limitation)
export const dynamic = 'force-dynamic';

const ZAPI_KEY = process.env.ZAPI_API_KEY || '';
const ZAPI_BASE = 'https://api.zapi.ink/v1';

const SCRAPE_ACTIONS_FOR_ZAPI_CAP = [
  'SCRAPE_LINKEDIN',
  'SCRAPE_JOBSTREET',
  'SCRAPE_INDEED',
  'SCRAPE_GLINTS',
  'SCRAPE_DEALLS',
];

/** Bentuk asli Zapi: { project, data: { items: [...] } } */
function extractJobs(d: unknown): Record<string, unknown>[] {
  if (Array.isArray(d)) return d as Record<string, unknown>[];
  if (d && typeof d === 'object') {
    const obj = d as Record<string, unknown>;
    const df = obj['data'];
    if (df && typeof df === 'object' && !Array.isArray(df)) {
      const inner = df as Record<string, unknown>;
      if (Array.isArray(inner['items'])) return inner['items'] as Record<string, unknown>[];
    }
    for (const k of ['data', 'jobs', 'results', 'listings', 'items']) {
      if (Array.isArray(obj[k])) return obj[k] as Record<string, unknown>[];
    }
  }
  return [];
}

function readString(source: Record<string, unknown>, key: string): string | null {
  const value = source[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function matchesGlintsLocation(job: Record<string, unknown>, requested: string): boolean {
  const loc = job.location;
  const region =
    loc && typeof loc === 'object' ? readString(loc as Record<string, unknown>, 'region') : null;
  const city =
    loc && typeof loc === 'object' ? readString(loc as Record<string, unknown>, 'city') : null;
  if (!region && !city) return false;
  const wanted = GLINTS_REGION_ALIASES[requested.trim()] ?? [requested.trim()];
  return [region, city]
    .filter((v): v is string => Boolean(v))
    .some((v) => wanted.some((w) => v.toLowerCase() === w.toLowerCase()));
}

/**
 * Satu panggilan Zapi. Mengembalikan `null` kalau API tidak 200,
 * dan pemanggil TIDAK boleh memotong kredit untuk kasus itu.
 */
async function callZapi(
  portal: Portal,
  query: string,
  location: string,
  deallsCityId: number | null
): Promise<Record<string, unknown>[] | null> {
  let res: Response;

  if (portal === 'dealls') {
    const params = new URLSearchParams({
      query,
      status: 'active',
      sort: 'publishedAt',
      sortDirection: 'desc',
      page: '1',
      limit: '20',
    });
    params.append('city', String(deallsCityId));
    res = await fetch(`${ZAPI_BASE}/jobs:dealls/search?${params.toString()}`, {
      headers: { 'x-api-key': ZAPI_KEY },
    });
  } else if (portal === 'glints') {
    // Glints tidak bisa difilter kota, jadi satu panggilan nasional.
    const params = new URLSearchParams({
      query,
      country: 'ID',
      postedWithin: 'PAST_24_HOURS',
      sort: 'latest',
    });
    res = await fetch(`${ZAPI_BASE}/jobs:glints/search?${params.toString()}`, {
      headers: { 'x-api-key': ZAPI_KEY },
    });
  } else if (portal === 'indeed') {
    const params = new URLSearchParams({ query, location, days: '1', sort: 'date', limit: '20' });
    res = await fetch(`${ZAPI_BASE}/jobs:indeed/search?${params.toString()}`, {
      headers: { 'x-api-key': ZAPI_KEY },
    });
  } else if (portal === 'jobstreet') {
    const params = new URLSearchParams({
      query,
      location,
      withinDays: '1',
      page: '1',
      limit: '20',
    });
    res = await fetch(`${ZAPI_BASE}/jobs:jobstreet/recent-jobs?${params.toString()}`, {
      headers: { 'x-api-key': ZAPI_KEY },
    });
    if (!res.ok) {
      res = await fetch(`${ZAPI_BASE}/jobs:jobstreet/search?${params.toString()}`, {
        headers: { 'x-api-key': ZAPI_KEY },
      });
    }
  } else {
    const params = new URLSearchParams({
      query,
      location,
      postedWithin: '24h',
      page: '1',
    });
    res = await fetch(`${ZAPI_BASE}/jobs:linkedin/search?${params.toString()}`, {
      headers: { 'x-api-key': ZAPI_KEY },
    });
  }

  if (!res.ok) {
    console.error(`Cron Zapi ${portal} @ ${location} (${res.status})`);
    return null;
  }

  return extractJobs(await res.json());
}

export async function GET(request: Request) {
  // Autentikasi cron agar tidak bisa dipanggil sembarang orang
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || !authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const expectedHeader = `Bearer ${cronSecret}`;
  const headerBuf = Buffer.from(authHeader);
  const expectedBuf = Buffer.from(expectedHeader);

  if (headerBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(headerBuf, expectedBuf)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Mode uji: ?dryRun=1 (tanpa tulis DB), ?ignoreSchedule=1 (abaikan filter hari),
  // ?userId=<uuid> (uji 1 user spesifik). Hanya untuk mengukur success rate.
  const url = new URL(request.url);
  const dryRun = url.searchParams.get('dryRun') === '1';
  const ignoreSchedule = url.searchParams.get('ignoreSchedule') === '1';
  const filterUserId = url.searchParams.get('userId');

  // Gunakan service role karena ini background job (tanpa user login aktif)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();
  // PostgreSQL ISO dow: 1 = Senin, 7 = Minggu
  let currentDay = now.getUTCDay();
  currentDay = currentDay === 0 ? 7 : currentDay; 
  // Asumsi server UTC; Vercel Hobby hanya bisa 1x/hari (lihat vercel.json)

  try {
    // 1. Cari user yang jadwalnya cocok dengan hari ini
    // Karena Vercel Hobby hanya bisa 1x sehari, kita abaikan filter scrape_hours
    const SCRAPE_LIMITS: Record<string, number> = { FREE: 1, PRO: 10, VIP: 25, ADMIN: 999999 };
    const SCRAPE_ACTIONS = ['SCRAPE_LINKEDIN', 'SCRAPE_JOBSTREET', 'SCRAPE_INDEED', 'SCRAPE_GLINTS', 'SCRAPE_DEALLS'];

    // Awal hari ini dalam WIB (UTC+7) sebagai ISO string untuk filter usage_events
    const wibNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
    wibNow.setUTCHours(0, 0, 0, 0);
    const todayStartISO = new Date(wibNow.getTime() - 7 * 60 * 60 * 1000).toISOString();

    let query = supabase
      .from('user_profiles')
      .select('user_id, target_job_titles, target_locations, auto_portals, auto_location')
      .eq('scrape_active', true);

    if (!ignoreSchedule) {
      query = query.contains('scrape_days', [currentDay]);
    }
    if (filterUserId) {
      query = query.eq('user_id', filterUserId);
    }

    const { data: users, error } = await query;

    if (error) {
      // Migrasi 014 belum dijalankan di database.
      const missingColumns =
        /auto_portals|auto_location|target_portals/.test(error.message);
      return NextResponse.json(
        {
          error: missingColumns
            ? 'Migrasi 014_auto_scrape_portals.sql belum dijalankan di Supabase.'
            : error.message,
          code: missingColumns ? 'MIGRATION_REQUIRED' : 'QUERY_FAILED',
        },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'Tidak ada jadwal scraping saat ini' });
    }

    // Pagu harian Zapi bersifat global, jadi dihitung sekali untuk semua user.
    const zapiUsedRes = await supabase
      .from('usage_events')
      .select('id', { count: 'exact', head: true })
      .in('action', SCRAPE_ACTIONS_FOR_ZAPI_CAP)
      .gte('created_at', todayStartISO);
    const zapiUsedBefore = zapiUsedRes.count ?? 0;

    const results = [];

    // 2. Loop scrape untuk tiap user
    for (const user of users) {
      // FIX 1: cek quota scrape user sebelum jalan (auto-scrape makan quota)
      const { data: planRow } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.user_id)
        .single();
      const plan: string = (planRow?.plan as string) || 'FREE';
      const limit = SCRAPE_LIMITS[plan] ?? SCRAPE_LIMITS.FREE;

      const { count: usedToday } = await supabase
        .from('usage_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.user_id)
        .in('action', SCRAPE_ACTIONS)
        .gte('created_at', todayStartISO);

      const used = usedToday ?? 0;
      if (used >= limit) {
        results.push({ user_id: user.user_id, status: 'skipped', reason: 'quota_exhausted', used, limit });
        continue;
      }

      const rawTitles: string[] = Array.isArray(user.target_job_titles)
        ? user.target_job_titles.filter(Boolean)
        : [];
      const rawLocations: string[] = Array.isArray(
        (user as { target_locations?: unknown }).target_locations
      )
        ? ((user as { target_locations: string[] }).target_locations.filter(Boolean))
        : [];
      if (rawTitles.length === 0) continue;

      const locations = rawLocations.length > 0 ? rawLocations : ['Indonesia'];

      const normalizeLocation = (loc: string, portal: Portal): string => {
        if (portal === 'dealls') return loc.trim();
        return (
          loc
            .replace(/^DKI\s+/i, '')
            .replace(/^DI\s+/i, '')
            .replace(/^D\.I\.\s+/i, '')
            .trim() || loc
        );
      };

      const startedAt = Date.now();
      const stats = { apiCalls: 0, apiErrors: 0, fetched: 0 };

      try {
        const collected: Record<string, unknown>[] = [];

        // Cron memakai portal yang dipilih user di pengaturan.
        // FREE dipaksa ke 1 portal supaya tidak langsung kena blokir kuota.
        const configuredPortals: Portal[] = Array.isArray(user.auto_portals)
          ? (user.auto_portals.filter((p: string) =>
              (PORTALS as readonly string[]).includes(p)
            ) as Portal[])
          : [];
        const portals: Portal[] =
          configuredPortals.length > 0 ? configuredPortals : ['linkedin'];
        const effectivePortals: Portal[] =
          plan === 'FREE' ? portals.slice(0, 1) : portals;

        // Lokasi cron: pakai lokasi prioritas kalau ada, kalau tidak pakai
        // seluruh target_locations user.
        const autoLocation = (user as { auto_location?: string | null }).auto_location;
        const cronLocations =
          plan === 'FREE'
            ? [autoLocation && String(autoLocation).trim() !== ''
                ? String(autoLocation).trim()
                : locations[0]]
            : locations;

        // Satu panggilan Zapi = satu kredit. Total panggilan dibatasi oleh
        // sisa kuota user DAN pagu harian Zapi.
        const zapiRemaining = remainingZapiCalls(zapiUsedBefore);
        let callCount = 0;
        const maxCalls = Math.max(0, Math.min(limit - used, zapiRemaining));

        for (const portal of effectivePortals) {
          if (callCount >= maxCalls) break;

          for (const rawLocation of cronLocations) {
            if (callCount >= maxCalls) break;
            if (collected.length >= 15) break;

            const location = normalizeLocation(rawLocation, portal);

            // Dealls hanya menerima cityId angka; 1 kota = 1 panggilan.
            const deallsCities =
              portal === 'dealls' ? getDeallsCities(rawLocation) : [];

            if (portal === 'dealls' && deallsCities.length === 0) {
              continue;
            }

            for (const title of rawTitles) {
              if (callCount >= maxCalls) break;
              if (collected.length >= 15) break;
              const searchQuery = title.trim();
              if (!searchQuery) continue;
              callCount++;
              stats.apiCalls++;

              const batch = await callZapi(portal, searchQuery, location, deallsCities[0]?.cityId ?? null);

              if (batch === null) {
                stats.apiErrors++;
                continue;
              }

              const filtered =
                portal === 'glints'
                  ? batch.filter((j) => matchesGlintsLocation(j, rawLocation))
                  : batch;

              stats.fetched += filtered.length;
              collected.push(
                ...filtered.map((j: Record<string, unknown>) => ({
                  ...j,
                  _scraped_location: location,
                }))
              );
            }
          }
        }

        const pick = (j: Record<string, unknown>, keys: string[]): string | null => {
          for (const k of keys) {
            const v = j[k];
            if (typeof v === 'string' && v.trim()) return v.trim();
            if (v && typeof v === 'object') {
              const nested = (v as Record<string, unknown>)['name'];
              if (typeof nested === 'string' && nested.trim()) return nested.trim();
            }
          }
          return null;
        };

        const cleanRawDescription = (text: string): string => {
          if (!text) return '';
          return text
            .replace(/<[^>]*>?/gm, '')
            .replace(/\n\s*\n/g, '\n\n')
            .trim();
        };

        // Insert hasil ke saved_jobs (skip saat dryRun)
        const jobsToInsert = collected.slice(0, 15).map((job) => ({
          user_id: user.user_id,
          job_title: pick(job, ['title', 'job_title', 'position', 'name']) || 'Unknown',
          company_name: pick(job, ['company', 'company_name', 'companyName', 'employer']) || 'Unknown',
          job_url: pick(job, ['url', 'job_url', 'link', 'apply_url', 'applyUrl']),
          external_job_id: pick(job, ['id', 'job_id', 'external_id', 'externalId', 'jobId']),
          location: pick(job, ['location', 'job_location', 'city', 'region']) || (job._scraped_location as string) || null,
          job_description: cleanRawDescription(pick(job, ['description', 'job_description', 'jobDescription', 'snippet', 'summary', 'details']) || `Lowongan di ${pick(job, ['company', 'company_name']) || 'perusahaan'}. Lihat detail via URL.`),
          source: `${PORTAL_LABEL[effectivePortals[0] ?? 'linkedin']} Auto`,
          status: 'discover',
        }));

        // FIX 2+3: upsert dedup + last_scraped_at hanya jika ada row baru
        let insertedCount = 0;
        let skippedDuplicates = 0;
        const insertErrors: string[] = [];

        for (const job of jobsToInsert) {
          if (job.job_url) {
            const { data, error } = await supabase
              .from('saved_jobs')
              .upsert(job, { onConflict: 'user_id, job_url', ignoreDuplicates: true })
              .select('id');
            if (error) {
              insertErrors.push(error.message);
            } else if (data && data.length > 0) {
              insertedCount++;
            } else {
              skippedDuplicates++;
            }
          } else {
            const { data, error } = await supabase
              .from('saved_jobs')
              .insert(job)
              .select('id');
            if (error) {
              insertErrors.push(error.message);
            } else if (data && data.length > 0) {
              insertedCount++;
            }
          }
        }

        if (dryRun) {
          // Mode uji: kembalikan metrics tanpa tulis DB
          results.push({
            user_id: user.user_id,
            status: 'success',
            apiCalls: stats.apiCalls,
            apiErrors: stats.apiErrors,
            fetched: stats.fetched,
            wouldInsert: jobsToInsert.length,
            ms: Date.now() - startedAt,
          });
          continue;
        }

        // FIX 3: last_scraped_at hanya jika ada insert baru
        if (insertedCount > 0) {
          await supabase
            .from('user_profiles')
            .update({ last_scraped_at: new Date().toISOString() })
            .eq('user_id', user.user_id);
        }

        // Kredit cron = jumlah panggilan Zapi yang benar-benar 200 OK.
        // Panggilan yang gagal TIDAK dipotong karena user tidak dapat
        // apa-apa dari panggilan itu.
        const successfulCalls = Math.max(0, stats.apiCalls - stats.apiErrors);
        if (successfulCalls > 0 && !dryRun) {
          const actionByPortal = {
            linkedin: 'SCRAPE_LINKEDIN',
            jobstreet: 'SCRAPE_JOBSTREET',
            indeed: 'SCRAPE_INDEED',
            glints: 'SCRAPE_GLINTS',
            dealls: 'SCRAPE_DEALLS',
          } as const;

          const events = Array.from({ length: successfulCalls }, () => ({
            user_id: user.user_id,
            action: actionByPortal[effectivePortals[0] ?? 'linkedin'],
            portal: effectivePortals[0] ?? 'linkedin',
          }));

          await supabase.from('usage_events').insert(events);
        }

        results.push({ user_id: user.user_id, status: 'success', count: insertedCount, skipped: skippedDuplicates, errors: insertErrors });
      } catch (err) {
        results.push({ user_id: user.user_id, status: 'error', error: err instanceof Error ? err.message : 'unknown', ...(dryRun ? { ms: Date.now() - startedAt } : {}) });
      }
    }

    if (dryRun) {
      const ok = results.filter((r) => r.status === 'success').length;
      return NextResponse.json({ dryRun: true, successRate: `${ok}/${results.length} users OK`, results });
    }

    return NextResponse.json({ success: true, processed: results.length, results });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
