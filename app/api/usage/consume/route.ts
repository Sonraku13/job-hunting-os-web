import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { UsageAction } from '@/lib/quota/limits';

const VALID_ACTIONS: UsageAction[] = [
  'AI_EXTRACT',
  'AI_GENERATE',
  'SCRAPE_LINKEDIN',
  'SCRAPE_JOBSTREET',
];

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
    const { action, portal } = body;

    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('consume_usage', {
      p_action: action,
      p_portal: portal || null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const result = data[0];

    return NextResponse.json({
      allowed: result.allowed,
      message: result.message,
      used_today: result.used_today,
      daily_limit: result.daily_limit,
      plan: result.plan,
    });
  } catch (error) {
    console.error('Consume usage error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
