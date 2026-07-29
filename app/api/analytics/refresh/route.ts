import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAIClient } from '@/lib/ai/client';
import { AI_CONFIG } from '@/lib/config';
import { ANALYTICS_PROMPT } from '@/lib/prompts/analytics';
import crypto from 'crypto';

export const runtime = 'nodejs';

function calculateHash(data: any): string {
  const content = JSON.stringify(data);
  return crypto.createHash('sha256').update(content).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { workspace_id, force = false } = await request.json();

    if (!workspace_id) {
      return Response.json({ error: 'workspace_id is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // 1. Fetch current analytics state
    const { data: analyticsState, error: stateError } = await supabase
      .from('workspace_analytics')
      .select('*')
      .eq('workspace_id', workspace_id)
      .single();

    if (analyticsState?.is_generating && !force) {
      return Response.json({ success: true, message: 'Already generating' });
    }

    // 2. Fetch all workspace data in parallel
    const [
      { data: courses },
      { data: assignments },
      { data: exams },
      { data: topics },
      { data: tasks }
    ] = await Promise.all([
      supabase.from('courses').select('id, title, course_code').eq('workspace_id', workspace_id),
      supabase.from('assignments').select('id, course_id, title, deadline, weight, status, priority').in('course_id', analyticsState ? [] : []), // We need a way to filter by workspace. We can join on courses. 
      supabase.from('exams').select('id, course_id, type, date, weight'),
      supabase.from('topics').select('id, course_id, week, topic, ai_status'),
      supabase.from('kanban_cards').select('id, course_id, title, status, due_date')
    ]);

    // Better way to fetch since assignments/topics don't have workspace_id: 
    // Fetch courses, then fetch related data using course IDs
    const { data: coursesData } = await supabase
      .from('courses')
      .select(`
        id, title, course_code,
        assignments ( id, title, deadline, weight, status, priority ),
        exams ( id, type, date, weight ),
        topics ( id, week, topic, ai_status ),
        kanban_cards ( id, title, status, due_date )
      `)
      .eq('workspace_id', workspace_id);

    if (!coursesData || coursesData.length === 0) {
      return Response.json({ success: true, message: 'No courses found' });
    }

    // 3. Compute Hash to see if data changed
    const newHash = calculateHash(coursesData);
    
    if (analyticsState && analyticsState.analytics_hash === newHash && !force) {
      return Response.json({ success: true, message: 'Data unchanged, cache valid' });
    }

    // 4. Set generating status
    await supabase
      .from('workspace_analytics')
      .upsert({
        workspace_id,
        is_generating: true,
        analytics_hash: newHash,
      }, { onConflict: 'workspace_id' });

    try {
      // 5. Generate AI Insights
      const client = getAIClient();
      const response = await client.chat.completions.create({
        model: AI_CONFIG.model,
        messages: [
          { role: 'system', content: ANALYTICS_PROMPT },
          { role: 'user', content: `Here is the current semester data:\n${JSON.stringify(coursesData, null, 2)}` },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });

      const rawJson = response.choices[0]?.message?.content ?? '{}';
      const result = JSON.parse(rawJson);

      // 6. Update courses with readiness scores
      if (result.course_readiness && Array.isArray(result.course_readiness)) {
        for (const cr of result.course_readiness) {
          await supabase
            .from('courses')
            .update({
              ai_exam_readiness: cr.ai_exam_readiness,
              ai_exam_readiness_explanation: cr.ai_exam_readiness_explanation
            })
            .eq('id', cr.course_id);
        }
      }

      // 7. Update workspace analytics
      const updatedAnalytics = {
        workspace_id,
        ai_insights: result.ai_insights,
        analytics_hash: newHash,
        is_generating: false,
        updated_at: new Date().toISOString()
      };

      await supabase
        .from('workspace_analytics')
        .upsert(updatedAnalytics, { onConflict: 'workspace_id' });

      return Response.json({ success: true, analytics: updatedAnalytics });

    } catch (err) {
      console.error('[Analytics Refresh] AI generation failed:', err);
      // Reset generating status
      await supabase
        .from('workspace_analytics')
        .update({ is_generating: false })
        .eq('workspace_id', workspace_id);
        
      throw err;
    }

  } catch (err) {
    console.error('[Analytics Refresh] Error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
