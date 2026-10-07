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
      // New fields from Quick Paste
      contact_email,
      contact_whatsapp,
      apply_url,
      source_url,
      is_parsed,
    } = body;

    if (!job_title || !company_name || !source) {
      return NextResponse.json(
        { error: 'Informasi lowongan tidak lengkap (job_title, company_name, source wajib ada)' },
        { status: 400 }
      );
    }

    // Opsi B: Jika input manual murni (bukan hasil OCR / Quick Paste), kurangi kuota AI
    if (!is_parsed) {
      const { data: quotaData, error: quotaError } = await supabase.rpc('consume_usage', {
        p_action: 'AI_EXTRACT',
        p_portal: null,
      });

      if (quotaError) {
        return NextResponse.json({ error: quotaError.message }, { status: 500 });
      }

      const quotaResult = quotaData?.[0];
      if (quotaResult && !quotaResult.allowed) {
        return NextResponse.json(
          {
            error: quotaResult.message || 'Kuota AI harian sudah habis.',
            used_today: quotaResult.used_today,
            daily_limit: quotaResult.daily_limit,
            plan: quotaResult.plan,
          },
          { status: 403 }
        );
      }
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
        // New fields
        contact_email: contact_email || null,
        contact_whatsapp: contact_whatsapp || null,
        apply_url: apply_url || null,
        source_url: source_url || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      quota_consumed: !is_parsed,
    });
  } catch (error) {
    console.error('Save job error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
