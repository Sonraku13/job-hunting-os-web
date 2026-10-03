import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { UsageAction } from '@/lib/quota/limits';
import { callGeminiExtract, callGeminiGenerate } from '@/lib/ai/gemini';

const VALID_ACTIONS: UsageAction[] = ['AI_EXTRACT', 'AI_GENERATE'];

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
    const { action, text } = body;

    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: 'Invalid AI action' }, { status: 400 });
    }

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Teks tidak valid' }, { status: 400 });
    }

    // 1. Consume Quota first
    const { data: quotaData, error: quotaError } = await supabase.rpc('consume_usage', {
      p_action: action,
      p_portal: null,
    });

    if (quotaError) {
      return NextResponse.json({ error: quotaError.message }, { status: 500 });
    }

    const result = quotaData[0];
    if (!result.allowed) {
      return NextResponse.json(
        { error: result.message, used_today: result.used_today, daily_limit: result.daily_limit },
        { status: 403 }
      );
    }

    // 2. Call Gemini
    try {
      let aiResult = null;
      if (action === 'AI_EXTRACT') {
        aiResult = await callGeminiExtract(text);
      } else if (action === 'AI_GENERATE') {
        aiResult = await callGeminiGenerate(text);
      }

      return NextResponse.json({
        success: true,
        data: aiResult,
        usage: {
          used_today: result.used_today,
          daily_limit: result.daily_limit,
          plan: result.plan,
        }
      });
    } catch (aiError: unknown) {
      console.error('Gemini error:', aiError);
      const errorMessage = aiError instanceof Error ? aiError.message : 'Unknown error';
      
      // Attempt rollback quota: delete latest event for this action today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: latestEvents } = await supabase
        .from('usage_events')
        .select('id')
        .eq('user_id', user.id)
        .eq('action', action)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (latestEvents && latestEvents.length > 0) {
        await supabase.from('usage_events').delete().eq('id', latestEvents[0].id);
      }

      return NextResponse.json(
        { error: `Gagal memproses AI: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('AI process error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
