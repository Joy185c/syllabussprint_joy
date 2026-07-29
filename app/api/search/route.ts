import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const workspaceId = request.nextUrl.searchParams.get('workspace_id');
    const query = request.nextUrl.searchParams.get('q');

    if (!workspaceId || !query) {
      return Response.json({ error: 'workspace_id and q required' }, { status: 400 });
    }

    const supabase = createServerClient();
    const q = `%${query}%`;

    const [assignmentsRes, topicsRes, examsRes] = await Promise.all([
      supabase
        .from('assignments')
        .select('id, title, deadline, courses!inner(workspace_id, title)')
        .eq('courses.workspace_id', workspaceId)
        .ilike('title', q)
        .limit(10),
      supabase
        .from('topics')
        .select('id, topic, week, courses!inner(workspace_id, title)')
        .eq('courses.workspace_id', workspaceId)
        .ilike('topic', q)
        .limit(10),
      supabase
        .from('exams')
        .select('id, type, date, courses!inner(workspace_id, title)')
        .eq('courses.workspace_id', workspaceId)
        .ilike('type', q)
        .limit(10),
    ]);

    return Response.json({
      assignments: assignmentsRes.data ?? [],
      topics: topicsRes.data ?? [],
      exams: examsRes.data ?? [],
    });
  } catch (err) {
    console.error('[Search] error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
