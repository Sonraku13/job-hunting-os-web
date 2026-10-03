import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const ZAPI_KEY = process.env.ZAPI_API_KEY || '';
const ZAPI_BASE = 'https://api.zapi.ink/v1';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ZAPI_KEY) {
      return NextResponse.json({ error: 'ZAPI key not configured' }, { status: 500 });
    }

    const body = await request.json();
    const {
      query,
      location = 'Indonesia',
      geoId,
      page = 1,
    } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query wajib diisi' }, { status: 400 });
    }

    // Call Zapi LinkedIn search with 24h filter
    const params = new URLSearchParams({
      query,
      location,
      postedWithin: '24h',
      page: page.toString(),
    });

    if (geoId) params.append('geoId', geoId);

    const res = await fetch(`${ZAPI_BASE}/jobs:linkedin/search?${params.toString()}`, {
      headers: {
        'x-api-key': ZAPI_KEY,
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Gagal mengambil data dari LinkedIn via Zapi' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('LinkedIn scrape error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
