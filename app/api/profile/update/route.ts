import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    let data, error;
    
    if (existing) {
      // Partial update
      const { data: updateData, error: updateError } = await supabase
        .from('user_profiles')
        .update(body)
        .eq('user_id', user.id)
        .select()
        .single();
      data = updateData;
      error = updateError;
    } else {
      // Insert new
      const { data: insertData, error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          id: user.id,
          ...body,
        })
        .select()
        .single();
      data = insertData;
      error = insertError;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({ success: true, profile: userProfile || { full_name: user.user_metadata?.full_name || '' } });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
