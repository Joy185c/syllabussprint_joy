'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWorkspaceId } from '@/lib/workspace';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { useColors } from '@/lib/useColors';

const CalendarWrapper = dynamic(() => import('@/components/CalendarWrapper'), { ssr: false });

export default function CalendarPage() {
  const [workspaceId, setWorkspaceId] = useState('');
  const colors = useColors();

  useEffect(() => {
    setWorkspaceId(getWorkspaceId());
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['timeline', workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/timeline?workspace_id=${workspaceId}`);
      if (!res.ok) throw new Error('Failed to fetch timeline events');
      return res.json();
    },
    enabled: !!workspaceId,
  });

  const events = data?.items?.map((item: any) => {
    let color = '#1E7B45'; // default primary
    if (item.type === 'exam') color = '#DC2626';
    else if (item.type === 'task') color = '#0F4C3A';
    else if (item.type === 'assignment') color = '#1E7B45';

    return {
      id: item.id,
      title: item.title,
      date: item.date,
      backgroundColor: color,
      borderColor: color,
      extendedProps: {
        type: item.type,
        course: item.courses?.title,
        description: item.description,
      }
    };
  }) ?? [];

  if (isLoading) return (
    <div className="container" style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
      <Loader2 size={32} color="#1E7B45" style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  );

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <div className="page-header">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: colors.text, marginBottom: '0.25rem' }}>Master Calendar</h1>
        <p style={{ color: colors.textMuted, fontSize: '0.9rem' }}>All your assignments, exams, and study sessions in one view.</p>
      </div>

      <div className="glass" style={{ padding: '1.5rem', minHeight: '600px' }}>
        <CalendarWrapper events={events} />
      </div>
    </div>
  );
}
