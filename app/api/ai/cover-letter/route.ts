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

    // 1. Consume Quota RPC for AI_GENERATE
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

    // 2. Fetch Job Details
    const { data: job, error: jobError } = await supabase
      .from('saved_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Lowongan tidak ditemukan' }, { status: 404 });
    }

    // 3. Fetch User Profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // 4. Generate Personalized Cover Letter with Gemini / Zapi
    const coverLetter = await callGeminiPersonalizedCoverLetter({
      jobTitle: job.job_title,
      companyName: job.company_name,
      jobDescription: job.job_description,
      applicantName: profile?.full_name || user.user_metadata?.full_name || 'Pelamar',
      currentRole: profile?.current_role || profile?.job_title,
      experienceYears: profile?.years_of_experience,
      summary: profile?.summary,
      careerGoals: profile?.career_goals,
      llmContext: profile?.llm_context,
    });

    // 5. Simpan hasil ke database agar dapat diakses & dicopy kapan saja
    await supabase
      .from('saved_jobs')
      .update({ cover_letter: coverLetter })
      .eq('id', jobId)
      .eq('user_id', user.id);

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
