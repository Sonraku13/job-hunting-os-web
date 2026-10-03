import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      job_title,
      company_name,
      job_url,
      location,
      job_type,
      salary_range,
      job_description,
      source,
    } = body;

    if (!job_title || !company_name || !source) {
      return NextResponse.json(
        { error: 'Informasi lowongan tidak lengkap (job_title, company_name, source wajib ada)' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('saved_jobs')
      .insert({
        user_id: user.id,
        job_title,
        company_name,
        job_url: job_url || null,
        location: location || null,
        job_type: job_type || null,
        salary_range: salary_range || null,
        job_description: job_description || null,
        source,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Save job error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
