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

    const body = await request.json().catch(() => ({}));
    const {
      query,
      country = 'ID',
      locationId,
      jobType,
      workArrangement,
      educationLevel,
      experience,
      postedWithin = 'PAST_WEEK',
      minSalary,
      currency = 'IDR',
      sort = 'latest',
    } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query wajib diisi' }, { status: 400 });
    }

    const params = new URLSearchParams({
      query,
      country,
      postedWithin,
      sort,
    });

    if (locationId) params.append('locationId', locationId);
    if (jobType) params.append('jobType', jobType);
    if (workArrangement) params.append('workArrangement', workArrangement);
    if (educationLevel) params.append('educationLevel', educationLevel);
    if (experience) params.append('experience', experience);
    if (minSalary) {
      params.append('minSalary', minSalary.toString());
      params.append('currency', currency);
    }

    const res = await fetch(`${ZAPI_BASE}/jobs:glints/search?${params.toString()}`, {
      headers: { 'x-api-key': ZAPI_KEY },
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Zapi Glints search error (${res.status}): ${errText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
