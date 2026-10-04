import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { calculateMatchScore } from '@/lib/ai/llm';

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
      .select('match_score, match_score_breakdown')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Lowongan tidak ditemukan' }, { status: 404 });
    }

    // 2. Return cached result if exists with valid score - NO quota consumed, NO LLM called
    if (
      typeof job.match_score === 'number' &&
      job.match_score > 0 &&
      job.match_score_breakdown &&
      typeof job.match_score_breakdown.score === 'number'
    ) {
      return NextResponse.json({
        success: true,
        matchResult: job.match_score_breakdown,
        cached: true,
        usage: null,
      });
    }

    // 3. Consume Quota RPC for AI_EXTRACT (only if not cached)
    const { data: quotaData, error: quotaError } = await supabase.rpc('consume_usage', {
      p_action: 'AI_EXTRACT',
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

    // 5. Calculate Match Score
    const matchResult = await calculateMatchScore({
      jobTitle: fullJob.job_title,
      companyName: fullJob.company_name,
      jobDescription: fullJob.job_description,
      applicantName: profile?.full_name || user.user_metadata?.full_name || 'Pelamar',
      currentRole: profile?.current_role || profile?.job_title,
      experienceYears: profile?.years_of_experience,
      summary: profile?.summary,
      skills: profile?.skills && Array.isArray(profile.skills) ? profile.skills : [],
    });

    // 6. Update saved_jobs in DB
    const { error: updateError } = await supabase
      .from('saved_jobs')
      .update({
        match_score: matchResult.score,
        match_score_breakdown: matchResult,
      })
      .eq('id', jobId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to save match_score:', updateError);
      return NextResponse.json({ error: 'Gagal menyimpan match score ke database' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      matchResult,
      usage: {
        used_today: quotaResult.used_today,
        daily_limit: quotaResult.daily_limit,
      },
    });
  } catch (error: unknown) {
    console.error('Calculate match score error:', error);
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan internal';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
