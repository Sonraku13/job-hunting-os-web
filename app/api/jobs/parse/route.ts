import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { parseUniversalJob } from '@/lib/ai/llm';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const text = formData.get('text') as string | null;
    const sourceUrl = formData.get('sourceUrl') as string | null;
    const imageFile = formData.get('image') as File | null;

    if (!text?.trim() && !imageFile) {
      return NextResponse.json(
        { error: 'Teks atau gambar minimal salah satu harus diisi' },
        { status: 400 }
      );
    }

    // Check quota first
    const { data: quotaData, error: quotaError } = await supabase.rpc('consume_usage', {
      p_action: 'AI_EXTRACT',
      p_portal: null,
    });

    if (quotaError) {
      return NextResponse.json({ error: quotaError.message }, { status: 500 });
    }

    const quotaResult = quotaData[0];
    if (!quotaResult.allowed) {
      return NextResponse.json(
        { 
          error: quotaResult.message, 
          used_today: quotaResult.used_today, 
          daily_limit: quotaResult.daily_limit,
          plan: quotaResult.plan,
        },
        { status: 403 }
      );
    }

    let imageBase64: string | undefined;
    let imageMimeType: string | undefined;

    if (imageFile) {
      const arrayBuffer = await imageFile.arrayBuffer();
      imageBase64 = Buffer.from(arrayBuffer).toString('base64');
      imageMimeType = imageFile.type;
    }

    // Parse with Gemini
    const parsed = await parseUniversalJob({
      text: text?.trim() || undefined,
      imageBase64,
      imageMimeType,
    });

    // Prepare response with source URL if provided
    const result = {
      ...parsed,
      source: 'manual',
      source_url: sourceUrl?.trim() || null,
    };

    return NextResponse.json({
      success: true,
      data: result,
      quota: {
        used_today: quotaResult.used_today,
        daily_limit: quotaResult.daily_limit,
      },
    });
  } catch (error) {
    console.error('Parse job error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}