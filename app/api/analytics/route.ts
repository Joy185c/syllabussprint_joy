import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspace_id');

    if (!workspaceId) {
      return Response.json({ error: 'workspace_id is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    const [
      { data: courses, error: coursesError },
      { data: kanban_cards, error: kanbanError },
      { data: workspace_analytics, error: analyticsError }
    ] = await Promise.all([
      supabase
        .from('courses')
        .select(`
          id, title, course_code, ai_exam_readiness, ai_exam_readiness_explanation,
          assignments ( id, title, deadline, weight, status, priority ),
          exams ( id, type, date, weight ),
          topics ( id, week, topic, ai_status, estimated_study_time )
        `)
        .eq('workspace_id', workspaceId),
      supabase
        .from('kanban_cards')
        .select(`id, course_id, title, status, due_date`)
        .in('course_id', (
           // subquery to get course_ids for this workspace
           // Wait, we can't do subquery directly easily in Supabase JS this way, 
           // we'll fetch kanban cards after fetching courses, or join.
           // Let's do it in a cleaner way by using the courses array later.
           [] // Placeholder, will fix below
        )),
      supabase
        .from('workspace_analytics')
        .select('*')
        .eq('workspace_id', workspaceId)
        .single()
    ]);

    // Let's re-fetch kanban_cards properly
    let cards: any[] = [];
    if (courses && courses.length > 0) {
      const courseIds = courses.map(c => c.id);
      const { data: kcData } = await supabase
        .from('kanban_cards')
        .select('id, course_id, title, status, due_date, updated_at')
        .in('course_id', courseIds);
      cards = kcData || [];
    }

    if (coursesError) throw coursesError;
    // analyticsError might be "PGRST116" (not found) which is fine for the first load
    
    return Response.json({ 
      success: true, 
      courses, 
      kanban_cards: cards,
      workspace_analytics: workspace_analytics || null 
    });

  } catch (err) {
    console.error('[Analytics GET] Error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
