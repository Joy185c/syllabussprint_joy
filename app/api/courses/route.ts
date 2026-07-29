import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const workspaceId = request.nextUrl.searchParams.get('workspace_id');
    if (!workspaceId) {
      return Response.json({ error: 'workspace_id required' }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('courses')
      .select(`
        id, title, course_code, semester, instructor, credits, description, created_at,
        assignments(count),
        exams(count)
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ courses: data ?? [] });
  } catch (err) {
    console.error('[Courses] GET error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
