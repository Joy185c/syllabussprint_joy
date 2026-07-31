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
    let color = '#9CA3AF'; // Important Dates -> Gray
    const lTitle = item.title?.toLowerCase() || '';
    if (item.type === 'assignment' || lTitle.includes('assignment')) color = '#F97316'; // Orange
    else if (lTitle.includes('quiz')) color = '#A855F7'; // Purple
    else if (item.type === 'exam' || lTitle.includes('midterm') || lTitle.includes('final')) color = '#EF4444'; // Red
    else if (lTitle.includes('project')) color = '#EAB308'; // Yellow
    else if (lTitle.includes('presentation')) color = '#3B82F6'; // Blue
    else if (item.type === 'study_session' || lTitle.includes('study')) color = '#22C55E'; // Green

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
