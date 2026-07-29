import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get('workspace_id');
  if (!workspaceId) {
    return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
  }

  try {
    const supabase = createServerClient();

    // Fetch all courses with nested data
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select(`
        *,
        assignments (*),
        exams (*),
        topics (*),
        kanban_cards (*)
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (coursesError) throw coursesError;

    // Fetch timeline items
    const { data: timeline, error: timelineError } = await supabase
      .from('timeline_items')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('date', { ascending: true });

    if (timelineError) throw timelineError;

    const exportData = {
      exported_at: new Date().toISOString(),
      workspace_id: workspaceId,
      summary: {
        total_courses: courses?.length ?? 0,
        total_assignments: courses?.flatMap((c: any) => c.assignments ?? []).length ?? 0,
        total_exams: courses?.flatMap((c: any) => c.exams ?? []).length ?? 0,
        total_topics: courses?.flatMap((c: any) => c.topics ?? []).length ?? 0,
        total_timeline_items: timeline?.length ?? 0,
      },
      courses: courses ?? [],
      timeline: timeline ?? [],
    };

    return NextResponse.json(exportData);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
