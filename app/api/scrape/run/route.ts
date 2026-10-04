import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const ZAPI_KEY = process.env.ZAPI_API_KEY || '';
const ZAPI_BASE = 'https://api.zapi.ink/v1';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ZAPI_KEY) {
      return NextResponse.json({ error: 'ZAPI_API_KEY belum disetel di server' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const portal = body.portal === 'jobstreet' ? 'jobstreet' : 'linkedin';
    const action = portal === 'jobstreet' ? 'SCRAPE_JOBSTREET' : 'SCRAPE_LINKEDIN';

    // 1. Consume Quota
    const { data: quotaData, error: quotaError } = await supabase.rpc('consume_usage', {
      p_action: action,
      p_portal: portal,
    });

    if (quotaError) {
      return NextResponse.json({ error: quotaError.message }, { status: 500 });
    }

    const quotaResult = quotaData[0];
    if (!quotaResult.allowed) {
      return NextResponse.json(
        {
          error: quotaResult.message,
          used_today: quotaResult.used_today,
          daily_limit: quotaResult.daily_limit,
        },
        { status: 403 }
      );
    }

    // 2. Ambil preferensi pencarian dari profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('target_job_titles, target_locations, linkedin_geo_id, jobstreet_location_id')
      .eq('user_id', user.id)
      .single();

    const rawTitles = profile?.target_job_titles?.filter(Boolean) ?? [];
    const rawLocations = profile?.target_locations?.filter(Boolean) ?? [];

    // Fallback default
    const titles: string[] = rawTitles.length > 0 ? rawTitles : ['Software Engineer'];
    const locations: string[] = rawLocations.length > 0 ? rawLocations : ['Indonesia'];

    // Normalisasi nama lokasi agar cocok dengan ekspektasi Zapi/LinkedIn
    // ("DKI Jakarta" -> "Jakarta", "DI Yogyakarta" -> "Yogyakarta")
    const normalizeLocation = (loc: string): string => {
      return loc
        .replace(/^DKI\s+/i, '')
        .replace(/^DI\s+/i, '')
        .replace(/^D\.I\.\s+/i, '')
        .trim() || loc;
    };

    // Ambil array data dari berbagai kemungkinan bentuk respons Zapi
    const extractJobs = (resData: unknown): Record<string, unknown>[] => {
      if (Array.isArray(resData)) return resData as Record<string, unknown>[];
      if (resData && typeof resData === 'object') {
        const obj = resData as Record<string, unknown>;
        for (const key of ['data', 'jobs', 'results', 'listings', 'items']) {
          if (Array.isArray(obj[key])) return obj[key] as Record<string, unknown>[];
        }
        // Beberapa provider membungkus di data.data
        if (obj['data'] && typeof obj['data'] === 'object') {
          const inner = obj['data'] as Record<string, unknown>;
          for (const key of ['jobs', 'results', 'listings', 'items']) {
            if (Array.isArray(inner[key])) return inner[key] as Record<string, unknown>[];
          }
        }
      }
      return [];
    };

    const pick = (j: Record<string, unknown>, keys: string[]): string | null => {
      for (const k of keys) {
        const v = j[k];
        if (typeof v === 'string' && v.trim()) return v.trim();
        if (v && typeof v === 'object') {
          // dukung bentuk nested { name: "..." } untuk company
          const nested = (v as Record<string, unknown>)['name'];
          if (typeof nested === 'string' && nested.trim()) return nested.trim();
        }
      }
      return null;
    };

    let allRawJobs: Record<string, unknown>[] = [];
    const perLocation: { location: string; fetched: number }[] = [];

    // 3. Loop tiap kombinasi lokasi x judul (1 call per kombinasi).
    // Zapi tidak konsisten mendukung operator OR, jadi query sederhana per judul lebih aman.
    // ponytail: ceiling 6 Zapi calls per aksi manual; naikkan + paginasi saat kuota Zapi longgar.
    const MAX_CALLS = 6;
    let callCount = 0;

    for (const rawLocation of locations) {
      const location = normalizeLocation(rawLocation);
      let fetchedForLocation = 0;

      for (const rawTitle of titles) {
        if (callCount >= MAX_CALLS) break;
        if (allRawJobs.length >= 20) break;
        const query = rawTitle.trim();
        if (!query) continue;
        callCount++;

        let rawJobs: Record<string, unknown>[] = [];

        // 3a. Panggil API Zapi (24 jam terakhir)
      if (portal === 'linkedin') {
        const params = new URLSearchParams({
          query,
          location,
          postedWithin: '24h',
          page: '1',
        });
        if (profile?.linkedin_geo_id) {
          params.append('geoId', profile.linkedin_geo_id);
        }

        const res = await fetch(`${ZAPI_BASE}/jobs:linkedin/search?${params.toString()}`, {
          headers: { 'x-api-key': ZAPI_KEY },
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error(`Gagal scrape LinkedIn untuk "${query}" @ ${location}:`, errText);
          continue; // Lanjut ke kombinasi berikutnya
        }

        const resData = await res.json();
        rawJobs = extractJobs(resData);
      } else {
        // Jobstreet
        const params = new URLSearchParams({
          query,
          location,
          postedWithinDays: '1',
          page: '1',
          limit: '20',
        });
        if (profile?.jobstreet_location_id) {
          params.append('locationId', profile.jobstreet_location_id);
        }

        const res = await fetch(`${ZAPI_BASE}/jobs:jobstreet/search?${params.toString()}`, {
          headers: { 'x-api-key': ZAPI_KEY },
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error(`Gagal scrape Jobstreet untuk "${query}" @ ${location}:`, errText);
          continue;
        }

        const resData = await res.json();
        rawJobs = extractJobs(resData);
      }

      // Tambahkan info lokasi asal ke setiap job
      const jobsWithLocation = rawJobs.map((j) => ({
        ...j,
        _scraped_location: location,
        _scraped_title: query,
      }));

      fetchedForLocation += jobsWithLocation.length;
      allRawJobs.push(...jobsWithLocation);

      // Batasi total agar tidak melebihi kuota DB
      if (allRawJobs.length >= 20) break;
      }
      perLocation.push({ location, fetched: fetchedForLocation });
      if (allRawJobs.length >= 20) break;
    }

    if (allRawJobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: `Tidak ditemukan lowongan baru dalam 24 jam terakhir untuk ${titles.length} posisi di lokasi: ${locations.join(', ')}.`,
        inserted: 0,
        usage: { used_today: quotaResult.used_today, daily_limit: quotaResult.daily_limit },
      });
    }

    // 4. Format data lowongan
    const jobsToInsert = allRawJobs.slice(0, 15).map((j) => ({
      user_id: user.id,
      job_title: pick(j, ['title', 'job_title', 'position', 'name']) || 'Lowongan Tanpa Judul',
      company_name: pick(j, ['company', 'company_name', 'companyName', 'employer']) || 'Perusahaan',
      job_url: pick(j, ['url', 'job_url', 'link', 'apply_url', 'applyUrl']),
      location: pick(j, ['location', 'job_location', 'city', 'region']) || j._scraped_location || 'Unknown',
      job_type: pick(j, ['job_type', 'type', 'employment_type', 'employmentType', 'work_type']),
      salary_range: pick(j, ['salary', 'salary_range', 'salaryRange', 'compensation']),
      job_description: pick(j, ['description', 'job_description', 'jobDescription', 'snippet', 'summary', 'details']),
      external_job_id: pick(j, ['id', 'job_id', 'external_id', 'externalId', 'jobId']),
      source: portal === 'linkedin' ? 'LinkedIn' : 'Jobstreet',
      status: 'discover',
    }));

    // 5. Simpan ke database (upsert by user_id+job_url OR user_id+external_job_id+source)
    let insertedCount = 0;
    let skippedDuplicates = 0;
    for (const job of jobsToInsert) {
      const hasUniqueKey = job.job_url || job.external_job_id;
      let upsertErr: unknown = null;

      if (hasUniqueKey) {
        const conflictTarget = job.external_job_id
          ? 'user_id, external_job_id, source'
          : 'user_id, job_url';
        const { error } = await supabase
          .from('saved_jobs')
          .upsert(job, {
            onConflict: conflictTarget,
            ignoreDuplicates: true, // only insert new rows
          });
        upsertErr = error;
      } else {
        // Tanpa unique key → insert biasa
        const { error } = await supabase.from('saved_jobs').insert(job);
        upsertErr = error;
      }

      if (upsertErr) {
        const errMsg = String(upsertErr);
        if (
          errMsg.includes('duplicate key') ||
          errMsg.includes('unique constraint') ||
          errMsg.includes('23505')
        ) {
          skippedDuplicates++;
        } else {
          console.error('Insert/upsert error:', upsertErr);
        }
      } else {
        insertedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil mengambil ${insertedCount} lowongan baru (${portal.toUpperCase()}) dari ${locations.length} lokasi dalam 24 jam terakhir!`,
      inserted: insertedCount,
      usage: { used_today: quotaResult.used_today, daily_limit: quotaResult.daily_limit },
    });
  } catch (error: unknown) {
    console.error('Manual scrape error:', error);
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan internal';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}