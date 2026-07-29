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
      .from('kanban_cards')
      .select('*, courses!inner(workspace_id)')
      .eq('courses.workspace_id', workspaceId)
      .order('position', { ascending: true });

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    const { data, error } = await query;

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ cards: data ?? [] });
  } catch (err) {
    console.error('[Kanban] GET error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, status, position } = await request.json();

    if (!id) {
      return Response.json({ error: 'Card id required' }, { status: 400 });
    }

    const supabase = createServerClient();
    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (position !== undefined) updateData.position = position;

    const { error } = await supabase
      .from('kanban_cards')
      .update(updateData)
      .eq('id', id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('[Kanban] PATCH error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
