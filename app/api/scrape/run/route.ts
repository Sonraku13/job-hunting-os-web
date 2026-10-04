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

    // Build query gabungan untuk job titles: "Title1" OR "Title2" OR ...
    const query = titles.map((t: string) => `"${t.trim()}"`).join(' OR ');

    let allRawJobs: any[] = [];

    // 3. Loop tiap lokasi (untuk menghindari query terlalu panjang & mendapatkan hasil per lokasi)
    for (const location of locations) {
      let rawJobs: any[] = [];

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
          console.error(`Gagal scrape LinkedIn untuk ${location}:`, errText);
          continue; // Lanjut ke lokasi berikutnya
        }

        const resData = await res.json();
        rawJobs = Array.isArray(resData.data)
          ? resData.data
          : Array.isArray(resData.jobs)
            ? resData.jobs
            : Array.isArray(resData)
              ? resData
              : [];
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
          console.error(`Gagal scrape Jobstreet untuk ${location}:`, errText);
          continue;
        }

        const resData = await res.json();
        rawJobs = Array.isArray(resData.data)
          ? resData.data
          : Array.isArray(resData.jobs)
            ? resData.jobs
            : Array.isArray(resData)
              ? resData
              : [];
      }

      // Tambahkan info lokasi asal ke setiap job
      const jobsWithLocation = rawJobs.map((j: any) => ({
        ...j,
        _scraped_location: location,
      }));

      allRawJobs.push(...jobsWithLocation);

      // Batasi total agar tidak melebihi kuota DB
      if (allRawJobs.length >= 20) break;
    }

    if (allRawJobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: `Tidak ditemukan lowongan baru dalam 24 jam terakhir untuk "${query}" di lokasi: ${locations.join(', ')}.`,
        inserted: 0,
        usage: { used_today: quotaResult.used_today, daily_limit: quotaResult.daily_limit },
      });
    }

    // 4. Format data lowongan
    const jobsToInsert = allRawJobs.slice(0, 15).map((j: any) => ({
      user_id: user.id,
      job_title: j.title || j.job_title || j.position || 'Lowongan Tanpa Judul',
      company_name: j.company || j.company_name || 'Perusahaan',
      job_url: j.url || j.job_url || j.link || null,
      location: j.location || j._scraped_location || 'Unknown',
      job_type: j.job_type || j.type || null,
      salary_range: j.salary || j.salary_range || null,
      job_description: j.description || j.job_description || j.snippet || null,
      source: portal === 'linkedin' ? 'LinkedIn' : 'Jobstreet',
      status: 'discover',
    }));

    // 5. Simpan ke database (abaikan lowongan jika URL sudah ada untuk user ini)
    let insertedCount = 0;
    for (const job of jobsToInsert) {
      if (job.job_url) {
        const { error: insertErr } = await supabase
          .from('saved_jobs')
          .insert(job);
        if (!insertErr) insertedCount++;
      } else {
        const { error: insertErr } = await supabase.from('saved_jobs').insert(job);
        if (!insertErr) insertedCount++;
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