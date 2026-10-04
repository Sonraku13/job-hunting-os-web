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

    // Ambil array data dari respons Zapi.
    // Bentuk asli (terbukti dari tes live):
    //   { project: "jobs:linkedin:search", data: { provider, query, items: [...] } }
    //   { project: "jobs:jobstreet:search", data: { provider, query, items: [...] } }
    const extractJobs = (resData: unknown): Record<string, unknown>[] => {
      if (Array.isArray(resData)) return resData as Record<string, unknown>[];
      if (resData && typeof resData === 'object') {
        const obj = resData as Record<string, unknown>;
        // Jalur utama: data.items
        const dataField = obj['data'];
        if (dataField && typeof dataField === 'object' && !Array.isArray(dataField)) {
          const inner = dataField as Record<string, unknown>;
          if (Array.isArray(inner['items'])) return inner['items'] as Record<string, unknown>[];
        }
        for (const key of ['data', 'jobs', 'results', 'listings', 'items']) {
          if (Array.isArray(obj[key])) return obj[key] as Record<string, unknown>[];
        }
        if (dataField && typeof dataField === 'object') {
          const inner = dataField as Record<string, unknown>;
          for (const key of ['jobs', 'results', 'listings', 'items', 'data']) {
            if (Array.isArray(inner[key])) return inner[key] as Record<string, unknown>[];
          }
        }
      }
      return [];
    };

    const str = (v: unknown): string | null =>
      typeof v === 'string' && v.trim() ? v.trim() : null;

    const pick = (j: Record<string, unknown>, keys: string[]): string | null => {
      for (const k of keys) {
        const v = j[k];
        const s = str(v);
        if (s) return s;
        if (v && typeof v === 'object') {
          // dukung bentuk nested { name: "..." } untuk company/location
          const nested = (v as Record<string, unknown>)['name'];
          const ns = str(nested);
          if (ns) return ns;
        }
      }
      return null;
    };

    // location di Zapi berbentuk objek { name, city, region, country }
    const formatLocation = (j: Record<string, unknown>, fallback: string): string => {
      const direct = pick(j, ['location', 'job_location']);
      if (direct) return direct;
      const loc = j['location'];
      if (loc && typeof loc === 'object') {
        const o = loc as Record<string, unknown>;
        const parts = [str(o['city']), str(o['region']), str(o['country'])]
          .filter(Boolean)
          .join(', ');
        if (parts) return parts;
      }
      const cityRegion = [str(j['city']), str(j['region'])].filter(Boolean).join(', ');
      if (cityRegion) return cityRegion;
      return fallback;
    };

    // salary di Jobstreet berbentuk objek { min, max, currency }
    const formatSalary = (j: Record<string, unknown>): string | null => {
      const direct = pick(j, ['salary_range', 'salaryRange', 'compensation']);
      if (direct) return direct;
      const s = j['salary'];
      if (s && typeof s === 'object') {
        const o = s as Record<string, unknown>;
        const min = typeof o['min'] === 'number' ? o['min'].toLocaleString('id-ID') : null;
        const max = typeof o['max'] === 'number' ? o['max'].toLocaleString('id-ID') : null;
        const cur = str(o['currency']) || 'IDR';
        if (min && max) return `${min} - ${max} ${cur}`;
        if (min) return `${min} ${cur}`;
        if (max) return `${max} ${cur}`;
      }
      return null;
    };

    const allRawJobs: Record<string, unknown>[] = [];
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
          limit: '20',
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
        // Jobstreet: gunakan endpoint recent-jobs sesuai webapp sheet
        const params = new URLSearchParams({
          query,
          location,
          withinDays: '1',
          page: '1',
          limit: '20',
        });
        if (profile?.jobstreet_location_id) {
          params.append('locationId', profile.jobstreet_location_id);
        }

        let res = await fetch(`${ZAPI_BASE}/jobs:jobstreet/recent-jobs?${params.toString()}`, {
          headers: { 'x-api-key': ZAPI_KEY },
        });

        // Fallback ke /search jika /recent-jobs tidak ok
        if (!res.ok) {
          res = await fetch(`${ZAPI_BASE}/jobs:jobstreet/search?${params.toString()}`, {
            headers: { 'x-api-key': ZAPI_KEY },
          });
        }

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

    // 4. Format data lowongan (mapping sesuai struktur asli Zapi hasil tes live)
    const jobsToInsert = allRawJobs.slice(0, 15).map((j) => {
      const externalId = pick(j, ['jobId', 'job_id', 'external_id', 'externalId', 'id']);
      let jobUrl = pick(j, ['url', 'job_url', 'link', 'apply_url', 'applyUrl']);
      
      // Pastikan job_url selalu terisi agar constraint unique (user_id, job_url) terpenuhi
      if (!jobUrl && externalId) {
        jobUrl = portal === 'linkedin'
          ? `https://www.linkedin.com/jobs/view/${externalId}`
          : `https://id.jobstreet.com/id/job/${externalId}`;
      }

      return {
        user_id: user.id,
        job_title: pick(j, ['title', 'job_title', 'position', 'name']) || 'Lowongan Tanpa Judul',
        company_name: pick(j, ['company', 'company_name', 'companyName', 'employer']) || 'Perusahaan',
        job_url: jobUrl,
        location: formatLocation(j, String(j._scraped_location || 'Unknown')),
        job_type: pick(j, ['employmentType', 'job_type', 'type', 'employment_type', 'work_arrangement', 'workArrangement']),
        salary_range: formatSalary(j),
        job_description: pick(j, ['description', 'job_description', 'jobDescription', 'snippet', 'summary', 'details']) || `Lowongan ${pick(j, ['title', 'job_title']) || ''} di ${pick(j, ['company', 'company_name']) || 'perusahaan'}. Lihat detail via URL.`,
        external_job_id: externalId,
        source: portal === 'linkedin' ? 'LinkedIn' : 'Jobstreet',
        status: 'discover',
      };
    });

    // 5. Simpan ke database dengan onConflict: 'user_id, job_url' (sesuai constraint saved_jobs_user_id_key)
    let insertedCount = 0;
    let skippedDuplicates = 0;
    const insertErrors: string[] = [];

    for (const job of jobsToInsert) {
      if (job.job_url) {
        const { data, error } = await supabase
          .from('saved_jobs')
          .upsert(job, {
            onConflict: 'user_id, job_url',
            ignoreDuplicates: true,
          })
          .select('id');

        if (error) {
          console.error('Upsert saved_jobs error:', error);
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
          console.error('Insert saved_jobs error:', error);
          insertErrors.push(error.message);
        } else if (data && data.length > 0) {
          insertedCount++;
        }
      }
    }

    if (insertedCount === 0 && skippedDuplicates > 0) {
      return NextResponse.json({
        success: true,
        message: `Ditemukan ${skippedDuplicates} lowongan, namun semuanya sudah pernah tersimpan sebelumnya di database Anda.`,
        inserted: 0,
        skipped: skippedDuplicates,
        usage: { used_today: quotaResult.used_today, daily_limit: quotaResult.daily_limit },
      });
    }

    if (insertedCount === 0 && insertErrors.length > 0) {
      return NextResponse.json(
        {
          error: `Gagal menyimpan lowongan ke database: ${insertErrors[0]}`,
          details: insertErrors,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil mengambil & menyimpan ${insertedCount} lowongan baru (${portal.toUpperCase()})!`,
      inserted: insertedCount,
      skipped: skippedDuplicates,
      usage: { used_today: quotaResult.used_today, daily_limit: quotaResult.daily_limit },
    });
  } catch (error: unknown) {
    console.error('Manual scrape error:', error);
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan internal';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}