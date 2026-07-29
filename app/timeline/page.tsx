'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWorkspaceId } from '@/lib/workspace';
import { Loader2, Calendar as CalIcon, BookOpen, AlertCircle, FileText } from 'lucide-react';
import type { TimelineItem } from '@/types';

export default function TimelinePage() {
  const [workspaceId, setWorkspaceId] = useState('');

  useEffect(() => {
    setWorkspaceId(getWorkspaceId());
  }, []);

  const { data, isLoading } = useQuery<{ items: (TimelineItem & { courses: { title: string } })[] }>({
    queryKey: ['timeline', workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/timeline?workspace_id=${workspaceId}`);
      if (!res.ok) throw new Error('Failed to fetch timeline');
      return res.json();
    },
    enabled: !!workspaceId,
  });

  if (isLoading) return (
    <div className="container" style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
      <Loader2 size={32} color="#818cf8" style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  );

  const items = data?.items ?? [];

  // Group by week
  const grouped = items.reduce((acc, item) => {
    const d = new Date(item.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay()); // Sunday
    const key = weekStart.toISOString().split('T')[0];
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <div className="page-header">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#e0e7ff', marginBottom: '0.25rem' }}>Study Timeline</h1>
        <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Chronological roadmap of all upcoming milestones and study sessions</p>
      </div>

      {items.length === 0 ? (
         <div className="glass" style={{ padding: '3rem', textAlign: 'center' }}>
           <CalIcon size={48} color="#6366f1" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
           <p style={{ color: '#9ca3af' }}>No timeline events found. Upload a syllabus to generate a study plan.</p>
         </div>
      ) : (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {Object.entries(grouped).sort().map(([weekKey, weekItems]) => (
            <div key={weekKey} style={{ marginBottom: '3rem' }}>
              <h3 style={{ color: '#a5b4fc', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CalIcon size={14} /> Week of {new Date(weekKey).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </h3>
              
              <div className="timeline-line">
                {weekItems.map((item, idx) => {
                  const typeColors = {
                    assignment: '#818cf8',
                    exam: '#f43f5e',
                    task: '#10b981',
                    deadline: '#f59e0b',
                  };
                  const color = typeColors[item.type];
                  const Icon = item.type === 'exam' ? AlertCircle : item.type === 'assignment' ? FileText : BookOpen;
                  const dateStr = new Date(item.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

                  return (
                    <div key={item.id} style={{ display: 'flex', gap: '1.5rem', marginBottom: idx === weekItems.length - 1 ? 0 : '1.5rem', position: 'relative', paddingLeft: '3rem' }}>
                      {/* Node point */}
                      <div style={{ position: 'absolute', left: '1.25rem', top: '0.25rem', transform: 'translateX(-50%)', width: '12px', height: '12px', borderRadius: '50%', background: color, border: '3px solid #0f0e17', zIndex: 2, boxShadow: `0 0 10px ${color}80` }} />
                      
                      {/* Content */}
                      <div className="glass glass-hover" style={{ flex: 1, padding: '1.25rem', borderLeft: `3px solid ${color}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <h4 style={{ color: '#e0e7ff', fontWeight: 600, fontSize: '1.05rem', margin: 0 }}>{item.title}</h4>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color, background: `${color}15`, padding: '2px 8px', borderRadius: '100px', textTransform: 'capitalize' }}>
                            {item.type}
                          </span>
                        </div>
                        <div style={{ color: '#818cf8', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <CalIcon size={12} /> {dateStr} • {item.courses.title}
                        </div>
                        {item.description && <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: 0 }}>{item.description}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
