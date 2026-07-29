import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { enrichTopicsBatch } from '@/lib/ai/enrichment';

export const runtime = 'nodejs';

// Process in chunks of 4 to prevent rate limits
const CHUNK_SIZE = 4;

export async function POST(request: NextRequest) {
  try {
    const { course_id } = await request.json();

    if (!course_id) {
      return Response.json({ error: 'course_id is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // 1. Fetch course context
    const { data: course } = await supabase
      .from('courses')
      .select('course_subject')
      .eq('id', course_id)
      .single();

    const courseSubject = course?.course_subject || '';

    // 2. Fetch all topics for the course that need enrichment
    // Check ai_status OR out of date version
    const { data: topics, error: fetchError } = await supabase
      .from('topics')
      .select('*')
      .eq('course_id', course_id)
      .in('ai_status', ['idle', 'queued', 'failed']);

    if (fetchError) {
      return Response.json({ error: fetchError.message }, { status: 500 });
    }

    if (!topics || topics.length === 0) {
      return Response.json({ success: true, processed: 0, message: 'No topics need enrichment' });
    }

    // Set status to generating for all
    await supabase
      .from('topics')
      .update({ ai_status: 'generating' })
      .in('id', topics.map(t => t.id));

    // 3. Process in chunks
    let processedCount = 0;
    
    for (let i = 0; i < topics.length; i += CHUNK_SIZE) {
      const chunk = topics.slice(i, i + CHUNK_SIZE);
      
      try {
        const enrichedChunk = await enrichTopicsBatch(chunk, courseSubject);
        
        // Update DB for each enriched topic
        for (const enriched of enrichedChunk) {
          await supabase
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
            .eq('id', enriched.topic_id);
            
          processedCount++;
        }
      } catch (err) {
        console.error(`[Enrichment Batch] Failed to process chunk ${i}`, err);
        // Revert status to failed for this chunk
        await supabase
          .from('topics')
          .update({ ai_status: 'failed' })
          .in('id', chunk.map(t => t.id));
      }
      
      // Delay between chunks if there are more chunks
      if (i + CHUNK_SIZE < topics.length) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    return Response.json({ success: true, processed: processedCount, total: topics.length });
  } catch (err) {
    console.error('[Enrichment Batch] Unexpected error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
