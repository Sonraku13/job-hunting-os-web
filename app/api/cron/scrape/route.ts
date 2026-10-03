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
      .select('user_id, target_job_titles, preferred_locations')
      .eq('scrape_active', true)
      .contains('scrape_days', [currentDay])
      .contains('scrape_hours', [currentHour]);

    if (error || !users || users.length === 0) {
      return NextResponse.json({ message: 'Tidak ada jadwal scraping saat ini' });
    }

    const results = [];

    // 2. Loop scrape untuk tiap user
    for (const user of users) {
      if (!user.target_job_titles?.[0]) continue;
      
      const query = user.target_job_titles[0];
      const location = user.preferred_locations?.[0] || 'Indonesia';

      try {
        const params = new URLSearchParams({
          query,
          location,
          postedWithin: '24h',
          page: '1',
        });

        // Contoh call ke LinkedIn Zapi (bisa dikembangkan ke Jobstreet)
        const res = await fetch(`${ZAPI_BASE}/jobs:linkedin/search?${params.toString()}`, {
          headers: { 'x-api-key': ZAPI_KEY },
        });

        if (res.ok) {
          const data = await res.json();
          // Insert hasil ke saved_jobs (simplifikasi)
          const jobsToInsert = (data.data || []).slice(0, 5).map((job: any) => ({
            user_id: user.user_id,
            job_title: job.title || 'Unknown',
            company_name: job.company || 'Unknown',
            job_url: job.url || null,
            location: job.location || null,
            source: 'LinkedIn Auto',
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
        }
      } catch (err) {
        results.push({ user_id: user.user_id, status: 'error' });
      }
    }

    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
