import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import {
  PORTALS,
  type Portal,
  estimateCredits,
  portalSupportsLocation,
} from '@/lib/constants/portal-locations';
import { remainingZapiCalls, wibDayStartISO, ZAPI_DAILY_CAP } from '@/lib/quota/zapi-cap';

const SCRAPE_LIMITS: Record<string, number> = {
  FREE: 1,
  PRO: 10,
  VIP: 25,
  ADMIN: 999999,
};

const SCRAPE_ACTIONS = [
  'SCRAPE_LINKEDIN',
  'SCRAPE_JOBSTREET',
  'SCRAPE_INDEED',
  'SCRAPE_GLINTS',
  'SCRAPE_DEALLS',
];

/**
 * Hitung biaya scraping sebelum dijalankan.
 *
 * Endpoint ini hanya membaca, tidak memotong credit apa pun. Tujuannya
 * supaya user tahu persis berapa credit yang akan terpakai sebelum menekan
 * tombol, dan supaya tahu sebelum mulai kalau kuotanya tidak cukup.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    const portals: Portal[] = Array.isArray(body.portals)
      ? body.portals.filter((p: string): p is Portal =>
          (PORTALS as readonly string[]).includes(p)
        )
      : [];

    const locations: string[] = Array.isArray(body.locations)
      ? body.locations.filter((l: unknown): l is string => typeof l === 'string' && l.trim() !== '')
      : [];

    if (portals.length === 0 || locations.length === 0) {
      return NextResponse.json({ error: 'Pilih minimal satu portal dan satu lokasi.' }, { status: 400 });
    }

    const planRes = await supabase.from('profiles').select('plan').eq('id', user.id).single();
    const profileRes = await supabase
      .from('user_profiles')
      .select('target_locations')
      .eq('user_id', user.id)
      .single();

    // Kuota Zapi bersifat global: semua user berbagi satu pagu harian.
    const zapiRes = await supabase
      .from('usage_events')
      .select('id', { count: 'exact', head: true })
      .in('action', SCRAPE_ACTIONS)
      .gte('created_at', wibDayStartISO());
    const zapiHeadroom = remainingZapiCalls(zapiRes.count ?? 0);

    const planRow = planRes.data;
    const profile = profileRes.data;

    const plan = (planRow?.plan as string) || 'FREE';
    const dailyLimit = SCRAPE_LIMITS[plan] ?? SCRAPE_LIMITS.FREE;

    const usedToday = await countScrapeUsedToday(supabase, user.id);
    const remainingUser = Math.max(0, dailyLimit - usedToday);

    const estimate = estimateCredits(portals, locations);

    // Lokasi yang tidak didukung portal manapun dalam kombinasi ini.
    const unsupportedByPortal: { portal: Portal; location: string }[] = [];
    for (const portal of portals) {
      for (const location of locations) {
        if (!portalSupportsLocation(portal, location)) {
          unsupportedByPortal.push({ portal, location });
        }
      }
    }

    const enoughUserQuota = remainingUser >= estimate.total;

    return NextResponse.json({
      success: true,
      profileLocations: profile?.target_locations ?? [],
      plan,
      usage: {
        usedToday,
        dailyLimit,
        remainingUser,
      },
      zapi: {
        dailyCap: ZAPI_DAILY_CAP,
        remaining: zapiHeadroom,
      },
      ...estimate,
      enoughUserQuota,
      // Pagu Zapi bersifat global, bukan milik user ini.
      enoughZapiQuota: zapiHeadroom >= estimate.total,
      unsupportedByPortal,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan internal';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function countScrapeUsedToday(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<number> {
  const { count } = await supabase
    .from('usage_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('action', SCRAPE_ACTIONS)
    .gte('created_at', wibDayStartISO());

  return count ?? 0;
}