import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, ...updateFields } = data;

    if (!id) {
      return Response.json({ error: 'Assignment id required' }, { status: 400 });
    }

    const supabase = createServerClient();
    
    const { data: updatedAssignment, error } = await supabase
      .from('assignments')
      .update(updateFields)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, assignment: updatedAssignment });
  } catch (err) {
    console.error('[Assignments] PATCH error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
