import { createServerClient } from '@/lib/supabase/server';

export async function triggerAnalyticsRefreshByCourse(courseId: string) {
  try {
    const supabase = createServerClient();
    const { data } = await supabase.from('courses').select('workspace_id').eq('id', courseId).single();
    if (data?.workspace_id) {
      // Fire and forget local fetch
      fetch(`http://localhost:3000/api/analytics/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: data.workspace_id })
      }).catch(() => {});
    }
  } catch (err) {
    console.error('Failed to trigger analytics refresh', err);
  }
}

export async function triggerAnalyticsRefreshByWorkspace(workspaceId: string) {
  try {
    fetch(`http://localhost:3000/api/analytics/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspace_id: workspaceId })
    }).catch(() => {});
  } catch (err) {
    console.error('Failed to trigger analytics refresh', err);
  }
}
