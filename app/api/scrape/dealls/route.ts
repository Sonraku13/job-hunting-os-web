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
      city,
      company,
      sector,
      benefit,
      employmentType,
      workArrangement,
      educationLevel,
      highSalary,
      status = 'active',
      sort = 'publishedAt',
      sortDirection = 'desc',
      page = 1,
      limit = 20,
    } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query wajib diisi' }, { status: 400 });
    }

    const params = new URLSearchParams({
      query,
      status,
      sort,
      sortDirection,
      page: page.toString(),
      limit: limit.toString(),
    });

    if (city !== undefined) params.append('city', city.toString());
    if (company) params.append('company', company);
    if (sector) params.append('sector', sector);
    if (benefit) params.append('benefit', benefit);
    if (employmentType) params.append('employmentType', employmentType);
    if (workArrangement) params.append('workArrangement', workArrangement);
    if (educationLevel !== undefined) params.append('educationLevel', educationLevel.toString());
    if (highSalary !== undefined) params.append('highSalary', highSalary.toString());

    const res = await fetch(`${ZAPI_BASE}/jobs:dealls/search?${params.toString()}`, {
      headers: { 'x-api-key': ZAPI_KEY },
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Zapi Dealls search error (${res.status}): ${errText}` },
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
