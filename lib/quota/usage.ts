import { createClient } from '@/lib/supabase/server';

export async function getTodayUsage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { aiUsed: 0, scrapeUsed: 0, portal: null };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: events } = await supabase
    .from('usage_events')
    .select('action, portal')
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: true });

  const aiUsed = events?.filter((e) => 
    e.action === 'AI_EXTRACT' || e.action === 'AI_GENERATE'
  ).length || 0;

  const scrapeUsed = events?.filter((e) =>
    e.action === 'SCRAPE_LINKEDIN' || e.action === 'SCRAPE_JOBSTREET'
  ).length || 0;

  const portal = events?.find((e) =>
    e.action === 'SCRAPE_LINKEDIN' || e.action === 'SCRAPE_JOBSTREET'
  )?.portal || null;

  return { aiUsed, scrapeUsed, portal };
}
