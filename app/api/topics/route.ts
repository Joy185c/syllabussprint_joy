import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, ...updateFields } = data;

    if (!id) {
      return Response.json({ error: 'Topic id required' }, { status: 400 });
    }

    const supabase = createServerClient();
    
    // Add updated metadata
    const updateData: Record<string, any> = {
      ...updateFields,
      updated_at: new Date().toISOString(),
      edited_by_user: true
    };

    const { data: updatedTopic, error } = await supabase
      .from('topics')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, topic: updatedTopic });
  } catch (err) {
    console.error('[Topics] PATCH error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
