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
      location = 'Jakarta',
      locationId,
      employmentType,
      workArrangement,
      salaryMin,
      salaryMax,
      page = 1,
      limit = 20,
    } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query wajib diisi' }, { status: 400 });
    }

    // Call Zapi Jobstreet search with 24h filter
    const params = new URLSearchParams({
      query,
      location,
      postedWithinDays: '1', // 24 jam terakhir
      page: page.toString(),
      limit: limit.toString(),
    });

    if (locationId) params.append('locationId', locationId);
    if (employmentType) params.append('employmentType', employmentType);
    if (workArrangement) params.append('workArrangement', workArrangement);
    if (salaryMin) params.append('salaryMin', salaryMin.toString());
    if (salaryMax) params.append('salaryMax', salaryMax.toString());

    const res = await fetch(`${ZAPI_BASE}/jobs:jobstreet/search?${params.toString()}`, {
      headers: {
        'x-api-key': ZAPI_KEY,
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Gagal mengambil data dari Jobstreet via Zapi' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Jobstreet scrape error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
