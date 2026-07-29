import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workspaceId = request.nextUrl.searchParams.get('workspace_id');

    if (!workspaceId) {
      return Response.json({ error: 'workspace_id required' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data: course, error } = await supabase
      .from('courses')
      .select(`
        *,
        assignments(*),
        exams(*),
        topics(*),
        timeline(*),
        kanban_cards(*)
      `)
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .single();

    if (error || !course) {
      console.error('[Course] fetch error:', error);
      return Response.json({ error: 'Course not found' }, { status: 404 });
    }

    // Sort nested relations in JS to avoid complex Supabase order chaining
    course.topics?.sort((a: any, b: any) => a.week - b.week);
    course.timeline?.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    course.kanban_cards?.sort((a: any, b: any) => a.position - b.position);

    if (error || !course) {
      return Response.json({ error: 'Course not found' }, { status: 404 });
    }

    return Response.json({ course });
  } catch (err) {
    console.error('[Course] GET error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = createServerClient();

    const { error } = await supabase
      .from('courses')
      .update(body)
      .eq('id', id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('[Course] PATCH error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
