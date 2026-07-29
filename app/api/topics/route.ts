import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

import crypto from 'crypto';

export const runtime = 'nodejs';

function generateTopicHash(t: any): string {
  const content = `${t.topic}|${t.description}|${t.learning_objectives}|${t.covered_concepts}`;
  return crypto.createHash('sha256').update(content).digest('hex');
}

export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, ...updateFields } = data;

    if (!id) {
      return Response.json({ error: 'Topic id required' }, { status: 400 });
    }

    const supabase = createServerClient();
    
    // Check if core fields changed to re-queue enrichment
    const newHash = generateTopicHash(updateFields);
    
    // Fetch existing topic to compare hash
    const { data: existingTopic } = await supabase
      .from('topics')
      .select('topic_hash, course_id')
      .eq('id', id)
      .single();

    const hashChanged = existingTopic && existingTopic.topic_hash !== newHash;

    // Add updated metadata
    const updateData: Record<string, any> = {
      ...updateFields,
      updated_at: new Date().toISOString(),
      edited_by_user: true,
      topic_hash: newHash,
    };

    if (hashChanged) {
      updateData.ai_status = 'queued';
    }

    const { data: updatedTopic, error } = await supabase
      .from('topics')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (hashChanged && existingTopic?.course_id) {
      // Trigger background enrichment asynchronously
      fetch(`${request.nextUrl.origin}/api/topics/enrich-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: existingTopic.course_id }),
      }).catch(err => console.error('Failed to trigger background enrichment:', err));
    }

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (updatedTopic?.course_id) {
       const { triggerAnalyticsRefreshByCourse } = await import('@/lib/analytics');
       triggerAnalyticsRefreshByCourse(updatedTopic.course_id);
    }

    return Response.json({ success: true, topic: updatedTopic });
  } catch (err) {
    console.error('[Topics] PATCH error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
