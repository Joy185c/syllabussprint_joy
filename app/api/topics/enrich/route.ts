import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { enrichTopicsBatch } from '@/lib/ai/enrichment';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { topic_id, force = false } = await request.json();

    if (!topic_id) {
      return Response.json({ error: 'topic_id is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data: topic, error: fetchError } = await supabase
      .from('topics')
      .select('*, courses(course_subject)')
      .eq('id', topic_id)
      .single();

    if (fetchError || !topic) {
      return Response.json({ error: 'Topic not found' }, { status: 404 });
    }

    if (!force && topic.ai_status === 'completed' && topic.ai_version === 'v1.0') {
       return Response.json({ success: true, topic, message: 'Already enriched' });
    }

    await supabase
      .from('topics')
      .update({ ai_status: 'generating' })
      .eq('id', topic_id);

    const courseSubject = topic.courses?.course_subject || '';

    try {
      const enrichedChunk = await enrichTopicsBatch([topic], courseSubject);
      
      if (enrichedChunk.length === 0) {
        throw new Error('No data returned');
      }

      const enriched = enrichedChunk[0];

      const { data: updatedTopic } = await supabase
        .from('topics')
        .update({
          ai_summary: enriched.ai_summary,
          ai_key_concepts: enriched.ai_key_concepts,
          ai_learning_outcomes: enriched.ai_learning_outcomes,
          ai_practice: enriched.ai_practice,
          ai_study_tips: enriched.ai_study_tips,
          ai_common_mistakes: enriched.ai_common_mistakes,
          estimated_study_time: enriched.estimated_study_time,
          difficulty_level: enriched.difficulty_level,
          ai_status: enriched.ai_status,
          ai_version: enriched.ai_version,
          prompt_version: enriched.prompt_version,
          ai_quality_score: enriched.ai_quality_score,
          ai_provider: enriched.ai_provider,
          ai_model: enriched.ai_model,
          ai_generated_on: enriched.ai_generated_on
        })
        .eq('id', topic_id)
        .select('*')
        .single();

      return Response.json({ success: true, topic: updatedTopic });

    } catch (err) {
      console.error('[Enrichment Single] Failed to process', err);
      
      const { data: failedTopic } = await supabase
        .from('topics')
        .update({ ai_status: 'failed' })
        .eq('id', topic_id)
        .select('*')
        .single();

      return Response.json({ success: false, topic: failedTopic, error: 'Enrichment failed' }, { status: 500 });
    }
  } catch (err) {
    console.error('[Enrichment Single] Unexpected error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
