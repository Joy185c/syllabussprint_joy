import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const workspaceId = request.nextUrl.searchParams.get('workspace_id');
    const courseId = request.nextUrl.searchParams.get('course_id');

    if (!workspaceId) {
      return Response.json({ error: 'workspace_id required' }, { status: 400 });
    }

    const supabase = createServerClient();

    let query = supabase
      .from('timeline')
      .select('*, courses!inner(workspace_id, title)')
      .eq('courses.workspace_id', workspaceId)
      .order('date', { ascending: true });

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    const { data, error } = await query;

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ items: data ?? [] });
  } catch (err) {
    console.error('[Timeline] GET error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
