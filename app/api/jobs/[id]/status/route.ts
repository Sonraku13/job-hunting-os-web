import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const VALID_STATUSES = ['discover', 'analyse', 'apply', 'refuse', 'archive'] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 });
    }

    const updates: Record<string, unknown> = { status };
    if (status === 'apply') {
      updates.applied_at = new Date().toISOString();
    } else if (status === 'archive') {
      updates.archived_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('saved_jobs')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Update job status error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
