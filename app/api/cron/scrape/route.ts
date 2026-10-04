import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Route ini dipanggil oleh Vercel Cron setiap jam
export const dynamic = 'force-dynamic';

const ZAPI_KEY = process.env.ZAPI_API_KEY || '';
const ZAPI_BASE = 'https://api.zapi.ink/v1';

export async function GET(request: Request) {
  // Autentikasi cron agar tidak bisa dipanggil sembarang orang
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Gunakan service role karena ini background job (tanpa user login aktif)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();
  // PostgreSQL ISO dow: 1 = Senin, 7 = Minggu
  let currentDay = now.getUTCDay();
  currentDay = currentDay === 0 ? 7 : currentDay; 
  const currentHour = now.getUTCHours(); // Asumsi server UTC, sesuaikan dengan timezone target jika perlu

  try {
    // 1. Cari user yang jadwalnya cocok dengan jam & hari ini
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('user_id, target_job_titles, target_locations')
      .eq('scrape_active', true)
      .contains('scrape_days', [currentDay])
      .contains('scrape_hours', [currentHour]);

    if (error || !users || users.length === 0) {
      return NextResponse.json({ message: 'Tidak ada jadwal scraping saat ini' });
    }

    const results = [];

    // 2. Loop scrape untuk tiap user
    for (const user of users) {
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

      const normalizeLocation = (loc: string): string => {
        return loc
          .replace(/^DKI\s+/i, '')
          .replace(/^DI\s+/i, '')
          .replace(/^D\.I\.\s+/i, '')
          .trim() || loc;
      };

      try {
        let collected: Record<string, unknown>[] = [];
        let callCount = 0;

        for (const rawLocation of locations) {
          const location = normalizeLocation(rawLocation);
          for (const title of rawTitles) {
            if (callCount >= 6) break;
            if (collected.length >= 15) break;
            const query = title.trim();
            if (!query) continue;
            callCount++;

            const params = new URLSearchParams({
              query,
              location,
              postedWithin: '24h',
              page: '1',
            });

            const res = await fetch(`${ZAPI_BASE}/jobs:linkedin/search?${params.toString()}`, {
              headers: { 'x-api-key': ZAPI_KEY },
            });

            if (!res.ok) continue;
            const resData = await res.json();
            const batch = Array.isArray(resData.data)
              ? resData.data
              : Array.isArray(resData.jobs)
                ? resData.jobs
                : Array.isArray(resData)
                  ? resData
                  : [];
            
            collected.push(...batch.map((j: Record<string, unknown>) => ({
              ...j,
              _scraped_location: location,
            })));
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

        // Insert hasil ke saved_jobs
        const jobsToInsert = collected.slice(0, 15).map((job) => ({
          user_id: user.user_id,
          job_title: pick(job, ['title', 'job_title', 'position', 'name']) || 'Unknown',
          company_name: pick(job, ['company', 'company_name', 'companyName', 'employer']) || 'Unknown',
          job_url: pick(job, ['url', 'job_url', 'link', 'apply_url', 'applyUrl']),
          external_job_id: pick(job, ['id', 'job_id', 'external_id', 'externalId', 'jobId']),
          location: pick(job, ['location', 'job_location', 'city', 'region']) || (job._scraped_location as string) || null,
          source: 'LinkedIn Auto',
          status: 'discover',
        }));

        if (jobsToInsert.length > 0) {
          await supabase.from('saved_jobs').insert(jobsToInsert);
        }

        // Update last_scraped_at
        await supabase
          .from('user_profiles')
          .update({ last_scraped_at: new Date().toISOString() })
          .eq('user_id', user.user_id);
          
        results.push({ user_id: user.user_id, status: 'success', count: jobsToInsert.length });
      } catch (err) {
        results.push({ user_id: user.user_id, status: 'error' });
      }
    }

    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
