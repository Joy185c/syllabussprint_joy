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
      .select('*, courses!inner(workspace_id, title, course_code, syllabus_files(filename))')
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
    const { id, status, position, title, description, due_date, priority, notes, type, course_id } = await request.json();

    if (!id) {
      return Response.json({ error: 'Card id required' }, { status: 400 });
    }

    const supabase = createServerClient();
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    // Determine if it was edited by user by checking if any content fields are being updated
    let isUserEdit = false;

    if (status !== undefined) updateData.status = status;
    if (position !== undefined) updateData.position = position;
    if (title !== undefined) { updateData.title = title; isUserEdit = true; }
    if (description !== undefined) { updateData.description = description; isUserEdit = true; }
    if (due_date !== undefined) { updateData.due_date = due_date; isUserEdit = true; }
    if (priority !== undefined) { updateData.priority = priority; isUserEdit = true; }
    if (notes !== undefined) { updateData.notes = notes; isUserEdit = true; }
    if (type !== undefined) { updateData.type = type; isUserEdit = true; }
    if (course_id !== undefined) { updateData.course_id = course_id; isUserEdit = true; }

    if (isUserEdit) {
      updateData.edited_by_user = true;
    }

    const { data: updatedCard, error } = await supabase
      .from('kanban_cards')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Sync Timeline if deadline changed or if it's a content edit involving dates
    if (isUserEdit && updatedCard) {
       if (updatedCard.due_date) {
          // check if timeline event exists
          const { data: existingTimeline } = await supabase.from('timeline').select('id').eq('kanban_card_id', id).single();
          if (existingTimeline) {
             await supabase.from('timeline').update({
               date: updatedCard.due_date,
               title: updatedCard.title,
               description: updatedCard.description || '',
               type: updatedCard.type || 'deadline'
             }).eq('kanban_card_id', id);
          } else {
             await supabase.from('timeline').insert({
               course_id: updatedCard.course_id,
               kanban_card_id: id,
               date: updatedCard.due_date,
               title: updatedCard.title,
               description: updatedCard.description || '',
               type: updatedCard.type || 'deadline'
             });
          }
       } else {
          // If due date was removed, maybe we should delete the timeline event?
          await supabase.from('timeline').delete().eq('kanban_card_id', id);
       }
    }

    if (updatedCard?.course_id) {
       const { triggerAnalyticsRefreshByCourse } = await import('@/lib/analytics');
       triggerAnalyticsRefreshByCourse(updatedCard.course_id);
    }

    return Response.json({ success: true, card: updatedCard });
  } catch (err) {
    console.error('[Kanban] PATCH error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, course_id, status, priority, due_date, type, notes } = await request.json();

    if (!title || !course_id) {
      return Response.json({ error: 'Title and Course ID are required' }, { status: 400 });
    }

    const supabase = createServerClient();
    
    // Get highest position in column
    const { data: existingCards } = await supabase
      .from('kanban_cards')
      .select('position')
      .eq('course_id', course_id)
      .eq('status', status || 'todo')
      .order('position', { ascending: false })
      .limit(1);
      
    const newPosition = (existingCards && existingCards.length > 0) ? existingCards[0].position + 1 : 0;

    const { data: newCard, error } = await supabase
      .from('kanban_cards')
      .insert({
        title,
        description: description || '',
        course_id,
        status: status || 'todo',
        priority: priority || 'medium',
        due_date: due_date || null,
        type: type || 'task',
        notes: notes || '',
        position: newPosition,
        source: 'Manual',
        edited_by_user: true
      })
      .select('*')
      .single();

    if (error) {
       return Response.json({ error: error.message }, { status: 500 });
    }
    
    // Sync to timeline if due date exists
    if (newCard && newCard.due_date) {
       await supabase.from('timeline').insert({
         course_id: newCard.course_id,
         kanban_card_id: newCard.id,
         date: newCard.due_date,
         title: newCard.title,
         description: newCard.description || '',
         type: newCard.type || 'deadline'
       });
    }

    if (newCard?.course_id) {
       const { triggerAnalyticsRefreshByCourse } = await import('@/lib/analytics');
       triggerAnalyticsRefreshByCourse(newCard.course_id);
    }

    return Response.json({ success: true, card: newCard });
  } catch (err) {
    console.error('[Kanban] POST error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
