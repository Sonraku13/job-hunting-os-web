import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import {
  PORTALS,
  type Portal,
  GLINTS_REGION_ALIASES,
} from '@/lib/constants/portal-locations';
import { SCRAPE_ACTION_BY_PORTAL, type UsageAction } from '@/lib/quota/limits';
import { remainingZapiCalls, wibDayStartISO } from '@/lib/quota/zapi-cap';

const ZAPI_KEY = process.env.ZAPI_API_KEY || '';
const ZAPI_BASE = 'https://api.zapi.ink/v1';

const SCRAPE_ACTIONS_FOR_ZAPI_CAP = [
  'SCRAPE_LINKEDIN',
  'SCRAPE_JOBSTREET',
  'SCRAPE_INDEED',
  'SCRAPE_GLINTS',
  'SCRAPE_DEALLS',
];

function cleanRawDescription(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>?/gm, '') // Hapus tag HTML jika ada
    .replace(/\n\s*\n/g, '\n\n') // Rapikan baris kosong berlebih
    .trim();
}

/**
 * Samakan nama lokasi dengan yang diharapkan portal
 * ("DKI Jakarta" -> "Jakarta", "DI Yogyakarta" -> "Yogyakarta").
 * Dealls dikecualikan karena ia menerima cityId, bukan nama.
 */
function normalizeLocation(loc: string, portal: Portal): string {
  if (portal === 'dealls') return loc.trim();
  return (
    loc
      .replace(/^DKI\s+/i, '')
      .replace(/^DI\s+/i, '')
      .replace(/^D\.I\.\s+/i, '')
      .trim() || loc
  );
}

function readString(source: Record<string, unknown>, key: string): string | null {
  const value = source[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/**
 * Cocokkan satu lowongan Glints dengan lokasi yang diminta user.
 * Glints mengembalikan `location.region` berupa nama provinsi apa adanya
 * ("Jawa Barat"), jadi pencocokan dilakukan di sini, bukan lewat API.
 */
function matchesGlintsLocation(job: Record<string, unknown>, requested: string): boolean {
  const loc = job.location;
  const region =
    loc && typeof loc === 'object'
      ? readString(loc as Record<string, unknown>, 'region')
      : null;
  const city =
    loc && typeof loc === 'object'
      ? readString(loc as Record<string, unknown>, 'city')
      : null;

  if (!region && !city) return false;

  const wanted = GLINTS_REGION_ALIASES[requested.trim()] ?? [requested.trim()];
  const haystack = [region, city].filter((v): v is string => Boolean(v));
  return haystack.some((v) => wanted.some((w) => v.toLowerCase() === w.toLowerCase()));
}

/**
 * Respons ketika Zapi tidak mengembalikan 200.
 * Credit TIDAK dipotong pada jalur ini.
 */
function zapiFailure(
  portal: Portal,
  location: string,
  status: number,
  body: string,
  deallsCityId?: number | null
) {
  console.error(`Zapi ${portal} @ ${location} (${status}):`, body.slice(0, 300));
  return NextResponse.json(
    {
      error: `${portal} gagal merespons (HTTP ${status}). Credit tidak dipotong.`,
      creditCharged: false,
      portal,
      location,
      deallsCityId: deallsCityId ?? null,
    },
    { status: 502 }
  );
}

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
    const portal: Portal = (PORTALS as readonly string[]).includes(body.portal)
      ? (body.portal as Portal)
      : 'linkedin';
    const action: UsageAction = SCRAPE_ACTION_BY_PORTAL[portal];

    // 1. Ambil preferensi pencarian dari profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('target_job_titles, target_locations, linkedin_geo_id, jobstreet_location_id')
      .eq('user_id', user.id)
      .single();

    // Frontend mengirim satu (portal, lokasi) per panggilan supaya tiap
    // kredit terisolasi dan Vercel tidak pernah timeout di tengah loop.
    const rawLocation: string = typeof body.location === 'string' ? body.location : '';
    const location = normalizeLocation(rawLocation || 'Indonesia', portal);
    const deallsCityId: number | null =
      typeof body.deallsCityId === 'number' ? body.deallsCityId : null;

    const rawTitles = profile?.target_job_titles?.filter(Boolean) ?? [];

    // Satu panggilan backend = satu judul pekerjaan utama.
    // Kalau user punya banyak judul, frontend mengulang panggilan untuk tiap judul.
    const requestedTitle = typeof body.title === 'string' ? body.title.trim() : '';
    const titles: string[] =
      requestedTitle && rawTitles.includes(requestedTitle)
        ? [requestedTitle]
        : rawTitles.length > 0
          ? [rawTitles[0]]
          : ['Software Engineer'];

    if (portal === 'dealls' && deallsCityId === null) {
      return NextResponse.json(
        { error: 'Dealls wajib menerima deallsCityId karena API-nya hanya menerima angka cityId.' },
        { status: 400 }
      );
    }

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

    // 3. Satu panggilan = satu (portal, lokasi) = satu kredit.
    // Panggilan berikutnya (lokasi berikutnya, portal berikutnya) datang dari
    // frontend sebagai request terpisah. Ini yang membuat frontend bebas
    // menampilkan progres tanpa risiko timeout di sisi server.
    {
      const query = titles[0].trim();

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
        // geoId hanya dipakai bila user tidak memilih lokasi spesifik,
        // karena geoId mengunci hasil ke satu wilayah saja.
        if (profile?.linkedin_geo_id && rawLocation === 'Indonesia') {
          params.append('geoId', profile.linkedin_geo_id);
        }

        const res = await fetch(`${ZAPI_BASE}/jobs:linkedin/search?${params.toString()}`, {
          headers: { 'x-api-key': ZAPI_KEY },
        });

        if (!res.ok) {
          return zapiFailure(portal, location, res.status, await res.text());
        }

        const resData = await res.json();
        rawJobs = extractJobs(resData);
      } else if (portal === 'indeed') {
        const params = new URLSearchParams({
          query,
          location,
          days: '1',
          sort: 'date',
          limit: '20',
        });

        const res = await fetch(`${ZAPI_BASE}/jobs:indeed/search?${params.toString()}`, {
          headers: { 'x-api-key': ZAPI_KEY },
        });

        if (!res.ok) {
          return zapiFailure(portal, location, res.status, await res.text());
        }

        const resData = await res.json();
        rawJobs = extractJobs(resData);
      } else if (portal === 'glints') {
        const params = new URLSearchParams({
          query,
          country: 'ID',
          postedWithin: 'PAST_24_HOURS',
          sort: 'latest',
        });

        const res = await fetch(`${ZAPI_BASE}/jobs:glints/search?${params.toString()}`, {
          headers: { 'x-api-key': ZAPI_KEY },
        });

        if (!res.ok) {
          return zapiFailure(portal, location, res.status, await res.text());
        }

        const resData = await res.json();
        const national = extractJobs(resData);

        // Glints tidak punya filter lokasi di API: `locationId` hanya berisi
        // UUID tingkat kecamatan yang berubah tiap query. Karena itu satu
        // panggilan nasional ini tetap dilayani satu kredit, lalu hasilnya
        // disaring di sini berdasarkan provinsi yang benar-benar dipinta user.
        rawJobs = national.filter((j) => matchesGlintsLocation(j, rawLocation));
      } else if (portal === 'dealls') {
        const params = new URLSearchParams({
          query,
          status: 'active',
          sort: 'publishedAt',
          sortDirection: 'desc',
          page: '1',
          limit: '20',
        });
        // Dealls hanya menerima cityId angka. Multi-kota dalam satu
        // permintaan ditolak API dengan HTTP 400, jadi satu panggilan satu kota.
        params.append('city', String(deallsCityId));

        const res = await fetch(`${ZAPI_BASE}/jobs:dealls/search?${params.toString()}`, {
          headers: { 'x-api-key': ZAPI_KEY },
        });

        if (!res.ok) {
          return zapiFailure(portal, location, res.status, await res.text(), deallsCityId);
        }

        const resData = await res.json();
        const extracted = extractJobs(resData);
        // Filter agar hanya menyertakan lowongan dalam 24 jam terakhir
        const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
        rawJobs = extracted.filter((j) => {
          const rawDate = j.postedAt || j.createdAt || j.latestUpdatedAt || j.updatedAt;
          if (typeof rawDate === 'string') {
            const parsed = Date.parse(rawDate);
            if (!isNaN(parsed)) return parsed >= twentyFourHoursAgo;
          }
          return true; // default include jika format tanggal tidak tersedia
        });
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
          return zapiFailure(portal, location, res.status, await res.text());
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

      allRawJobs.push(...jobsWithLocation);
    }

    // 4. Zona kuota. Panggilan Zapi sudah sukses di atas, jadi sekarang
    // baru kred-nya dipotong. Kalau Zapi gagal, credit user utuh.
    const zapiUsed = await supabase
      .from('usage_events')
      .select('id', { count: 'exact', head: true })
      .in('action', SCRAPE_ACTIONS_FOR_ZAPI_CAP)
      .gte('created_at', wibDayStartISO());
    const zapiHeadroom = remainingZapiCalls(zapiUsed.count ?? 0);
    if (zapiHeadroom <= 0) {
      return NextResponse.json(
        { error: 'Kuota harian scraping platform sudah habis. Coba lagi besok.' },
        { status: 503 }
      );
    }

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
          creditCharged: false,
        },
        { status: 403 }
      );
    }

    if (allRawJobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: `Tidak ada lowongan ${portal} dalam 24 jam terakhir untuk "${titles[0]}" di ${rawLocation || 'Indonesia'}.`,
        inserted: 0,
        fetched: 0,
        creditCharged: true,
        usage: { used_today: quotaResult.used_today, daily_limit: quotaResult.daily_limit },
      });
    }

    // 4. Format data lowongan (mapping sesuai struktur asli Zapi hasil tes live)
    const jobsToInsert = allRawJobs.slice(0, 15).map((j) => {
      const externalId = pick(j, ['jobId', 'job_id', 'external_id', 'externalId', 'id']);
      let jobUrl = pick(j, ['url', 'job_url', 'link', 'apply_url', 'applyUrl']);
      
      // Pastikan job_url selalu terisi agar constraint unique (user_id, job_url) terpenuhi
      if (!jobUrl && externalId) {
        jobUrl =
          portal === 'linkedin' ? `https://www.linkedin.com/jobs/view/${externalId}` :
          portal === 'jobstreet' ? `https://id.jobstreet.com/id/job/${externalId}` :
          portal === 'indeed' ? `https://id.indeed.com/viewjob?jk=${externalId}` :
          portal === 'glints' ? `https://glints.com/id/opportunities/jobs/${externalId}` :
          portal === 'dealls' ? `https://dealls.com/loker/${externalId}` :
          `https://example.com/job/${externalId}`;
      }

      const sourceLabel =
        portal === 'linkedin' ? 'LinkedIn' :
        portal === 'jobstreet' ? 'Jobstreet' :
        portal === 'indeed' ? 'Indeed' :
        portal === 'glints' ? 'Glints' :
        portal === 'dealls' ? 'Dealls' : 'Unknown';

      return {
        user_id: user.id,
        job_title: pick(j, ['title', 'job_title', 'position', 'name']) || 'Lowongan Tanpa Judul',
        company_name: pick(j, ['company', 'company_name', 'companyName', 'employer']) || 'Perusahaan',
        job_url: jobUrl,
        location: formatLocation(j, String(j._scraped_location || 'Unknown')),
        job_type: pick(j, ['employmentType', 'job_type', 'type', 'employment_type', 'work_arrangement', 'workArrangement']),
        salary_range: formatSalary(j),
        job_description: cleanRawDescription(pick(j, ['description', 'job_description', 'jobDescription', 'snippet', 'summary', 'details']) || `Lowongan ${pick(j, ['title', 'job_title']) || ''} di ${pick(j, ['company', 'company_name']) || 'perusahaan'}. Lihat detail via URL.`),
        external_job_id: externalId,
        source: sourceLabel,
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
        message: `${skippedDuplicates} lowongan ${portal} di ${rawLocation || 'Indonesia'} sudah pernah tersimpan sebelumnya.`,
        inserted: 0,
        skipped: skippedDuplicates,
        fetched: allRawJobs.length,
        creditCharged: true,
        usage: { used_today: quotaResult.used_today, daily_limit: quotaResult.daily_limit },
      });
    }

    if (insertedCount === 0 && insertErrors.length > 0) {
      return NextResponse.json(
        {
          error: `Gagal menyimpan lowongan ke database: ${insertErrors[0]}`,
          details: insertErrors,
          creditCharged: true,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${insertedCount} lowongan baru dari ${portal} @ ${rawLocation || 'Indonesia'}.`,
      inserted: insertedCount,
      skipped: skippedDuplicates,
      fetched: allRawJobs.length,
      creditCharged: true,
      portal,
      location: rawLocation || 'Indonesia',
      usage: { used_today: quotaResult.used_today, daily_limit: quotaResult.daily_limit },
    });
  } catch (error: unknown) {
    console.error('Manual scrape error:', error);
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan internal';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}