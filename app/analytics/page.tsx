'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWorkspaceId } from '@/lib/workspace';
import { Loader2, TrendingUp, BookOpen, GraduationCap } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function AnalyticsPage() {
  const [workspaceId, setWorkspaceId] = useState('');

  useEffect(() => {
    setWorkspaceId(getWorkspaceId());
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', workspaceId],
    queryFn: async () => {
      // For MVP analytics, we just reuse the courses endpoint which returns nested exams/assignments
      const res = await fetch(`/api/courses?workspace_id=${workspaceId}`);
      if (!res.ok) throw new Error('Failed to fetch data');
      return res.json();
    },
    enabled: !!workspaceId,
  });

  if (isLoading) return (
    <div className="container" style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
      <Loader2 size={32} color="#818cf8" style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  );

  const courses = data?.courses ?? [];
  const assignments = courses.flatMap((c: any) => c.assignments ?? []);
  const exams = courses.flatMap((c: any) => c.exams ?? []);

  // Compute completion stats
  const completed = assignments.filter((a: any) => a.status === 'completed').length;
  const inProgress = assignments.filter((a: any) => a.status === 'in_progress').length;
  const pending = assignments.length - completed - inProgress;

  const pieData = [
    { name: 'Completed', value: completed, color: '#10b981' },
    { name: 'In Progress', value: inProgress, color: '#f59e0b' },
    { name: 'Pending', value: pending, color: '#6366f1' },
  ].filter(d => d.value > 0);

  // If completely empty, show placeholder pie
  if (pieData.length === 0) pieData.push({ name: 'No Assignments', value: 1, color: '#374151' });

  // Compute load per course (just assignments + exams count)
  const barData = courses.map((c: any) => ({
    name: c.course_code || c.title.substring(0, 10),
    assignments: (c.assignments?.length || 0),
    exams: (c.exams?.length || 0),
  }));

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <div className="page-header">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#e0e7ff', marginBottom: '0.25rem' }}>Analytics</h1>
        <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Visualize your semester progress and workload.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        
        {/* Completion Donut */}
        <div className="glass" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: '#e0e7ff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <TrendingUp size={18} color="#10b981" /> Assignment Completion
          </h3>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.2)" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(30,27,46,0.9)', border: '1px solid #4f46e5', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
            {pieData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#9ca3af' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.color }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>

        {/* Workload Bar Chart */}
        <div className="glass" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: '#e0e7ff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <BookOpen size={18} color="#818cf8" /> Course Workload
          </h3>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: 'rgba(30,27,46,0.9)', border: '1px solid #4f46e5', borderRadius: '8px', color: '#e0e7ff' }} />
                <Bar dataKey="assignments" name="Assignments" stackId="a" fill="#818cf8" radius={[0,0,4,4]} />
                <Bar dataKey="exams" name="Exams" stackId="a" fill="#f43f5e" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
