import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { topic_id } = await request.json();

    if (!topic_id) {
      return Response.json({ error: 'topic_id is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data: updatedTopic, error } = await supabase
      .from('topics')
      .update({
        ai_summary: '',
        ai_key_concepts: [],
        ai_learning_outcomes: [],
        ai_practice: [],
        ai_study_tips: [],
        ai_common_mistakes: [],
        estimated_study_time: '',
        difficulty_level: '',
        ai_status: 'idle',
        ai_version: 'v1.0',
        prompt_version: '',
        ai_quality_score: 0,
        ai_provider: '',
        ai_model: '',
        ai_generated_on: null
      })
      .eq('id', topic_id)
      .select('*')
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, topic: updatedTopic });

  } catch (err) {
    console.error('[Enrichment Reset] Unexpected error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
