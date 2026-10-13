import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { PORTALS, type Portal } from '@/lib/constants/portal-locations';

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const allowedFields = [
      'full_name', 'job_title', 'summary', 'skills', 'experience',
      'education', 'portfolio_url', 'target_job_titles', 'remote_only',
      'salary_range', 'preferred_locations', 'phone_number', 'email_address',
      'llm_context', 'scrape_active', 'scrape_days', 'scrape_hours',
      'target_locations', 'ui_preferred_language',
      // Pengaturan scraping per portal.
      // Catatan: field di bawah ini sudah dikirim form settings sejak dulu
      // tapi sebelumnya dibuang karena tidak ada di whitelist.
      'target_portals', 'auto_portals', 'auto_location',
      'linkedin_geo_id', 'jobstreet_location_id',
      'target_classifications', 'target_employment_types', 'target_work_arrangements',
      'min_salary', 'max_salary'
    ];

    const sanitizedBody: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        sanitizedBody[key] = body[key];
      }
    }

    // Buang nilai portal yang tidak dikenal supaya tidak ada data sampah
    // yang nanti membuat cron memanggil endpoint yang salah.
    for (const key of ['target_portals', 'auto_portals']) {
      const raw = sanitizedBody[key];
      if (raw === undefined) continue;
      const list = Array.isArray(raw) ? raw : [];
      const clean = list.filter(
        (p: unknown): p is Portal =>
          typeof p === 'string' && (PORTALS as readonly string[]).includes(p)
      );
      sanitizedBody[key] = clean.length > 0 ? clean : ['linkedin'];
    }

    if (typeof sanitizedBody['auto_location'] === 'string') {
      const loc = (sanitizedBody['auto_location'] as string).trim();
      sanitizedBody['auto_location'] = loc === '' ? null : loc;
    }

    const { data: existing } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    let data, error;
    
    if (existing) {
      // Partial update
      const { data: updateData, error: updateError } = await supabase
        .from('user_profiles')
        .update(sanitizedBody)
        .eq('user_id', user.id)
        .select()
        .single();
      data = updateData;
      error = updateError;
    } else {
      // Insert new
      const { data: insertData, error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          id: user.id,
          ...sanitizedBody,
        })
        .select()
        .single();
      data = insertData;
      error = insertError;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({ success: true, profile: userProfile || { full_name: user.user_metadata?.full_name || '' } });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
