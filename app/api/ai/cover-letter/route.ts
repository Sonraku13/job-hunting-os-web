import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { callGeminiPersonalizedCoverLetter } from '@/lib/ai/gemini';

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
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'jobId wajib disertakan' }, { status: 400 });
    }

    // 1. Fetch Job Details FIRST - check cache
    const { data: job, error: jobError } = await supabase
      .from('saved_jobs')
      .select('cover_letter')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Lowongan tidak ditemukan' }, { status: 404 });
    }

    // 2. Return cached result if exists - NO quota consumed, NO LLM called
    if (job.cover_letter && job.cover_letter.trim().length > 0) {
      return NextResponse.json({
        success: true,
        coverLetter: job.cover_letter,
        cached: true,
        usage: null,
      });
    }

    // 3. Consume Quota RPC for AI_GENERATE (only if not cached)
    const { data: quotaData, error: quotaError } = await supabase.rpc('consume_usage', {
      p_action: 'AI_GENERATE',
      p_portal: null,
    });

    if (quotaError) {
      return NextResponse.json({ error: quotaError.message }, { status: 500 });
    }

    const quotaResult = quotaData[0];
    if (!quotaResult.allowed) {
      return NextResponse.json(
        { error: quotaResult.message, used_today: quotaResult.used_today, daily_limit: quotaResult.daily_limit },
        { status: 403 }
      );
    }

    // 4. Fetch full job details & profile for generation
    const { data: fullJob, error: fullJobError } = await supabase
      .from('saved_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (fullJobError || !fullJob) {
      return NextResponse.json({ error: 'Lowongan tidak ditemukan' }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // 5. Generate Personalized Cover Letter
    const coverLetter = await callGeminiPersonalizedCoverLetter({
      jobTitle: fullJob.job_title,
      companyName: fullJob.company_name,
      jobDescription: fullJob.job_description,
      applicantName: profile?.full_name || user.user_metadata?.full_name || 'Pelamar',
      currentRole: profile?.current_role || profile?.job_title,
      experienceYears: profile?.years_of_experience,
      skills: profile?.skills && Array.isArray(profile.skills) ? profile.skills : null,
      summary: profile?.summary,
      careerGoals: profile?.career_goals,
      llmContext: profile?.llm_context,
      phone: profile?.phone_number,
      email: profile?.email_address || user.email,
      preferredLanguage: profile?.ui_preferred_language || 'Indonesian',
    });

    // 6. Simpan hasil ke database
    const { error: updateError } = await supabase
      .from('saved_jobs')
      .update({ cover_letter: coverLetter })
      .eq('id', jobId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to save cover_letter:', updateError);
      return NextResponse.json({ error: 'Gagal menyimpan cover letter ke database' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      coverLetter,
      usage: {
        used_today: quotaResult.used_today,
        daily_limit: quotaResult.daily_limit,
      },
    });
  } catch (error: unknown) {
    console.error('Generate cover letter error:', error);
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan internal';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
