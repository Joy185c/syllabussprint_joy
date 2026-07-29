'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getWorkspaceId } from '@/lib/workspace';
import { BookOpen, ClipboardList, GraduationCap, Clock, TrendingUp, Upload, ArrowRight, Calendar } from 'lucide-react';
import type { Course, Assignment, Exam } from '@/types';

interface DashboardData {
  courses: Course[];
}

function StatCard({ icon: Icon, label, value, color, href }: {
  icon: typeof BookOpen; label: string; value: number | string; color: string; href?: string;
}) {
  const content = (
    <motion.div
      whileHover={{ y: -3 }}
      className="stat-card"
      style={{ borderTop: `3px solid ${color}` }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{
          width: '40px', height: '40px',
          background: `${color}18`,
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} color={color} />
        </div>
        {href && <ArrowRight size={14} color="#6B7280" />}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{value}</div>
      <div style={{ color: '#4B5563', fontSize: '0.85rem', marginTop: '0.25rem' }}>{label}</div>
    </motion.div>
  );
  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{content}</Link> : content;
}

export default function DashboardPage() {
  const [workspaceId, setWorkspaceId] = useState('');

  useEffect(() => {
    setWorkspaceId(getWorkspaceId());
  }, []);

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['courses', workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/courses?workspace_id=${workspaceId}`);
      return res.json();
    },
    enabled: !!workspaceId,
  });

  const courses = data?.courses ?? [];
  const allAssignments = courses.flatMap((c) => (c.assignments ?? []) as Assignment[]);
  const allExams = courses.flatMap((c) => (c.exams ?? []) as Exam[]);
  const completed = allAssignments.filter((a) => a.status === 'completed').length;
  const completionPct = allAssignments.length > 0 ? Math.round((completed / allAssignments.length) * 100) : 0;

  const upcoming = [...allAssignments, ...allExams]
    .filter((i) => {
      const date = 'deadline' in i ? i.deadline : (i as Exam).date;
      return date && new Date(date) > new Date();
    })
    .sort((a, b) => {
      const da = 'deadline' in a ? a.deadline! : (a as Exam).date!;
      const db = 'deadline' in b ? b.deadline! : (b as Exam).date!;
      return new Date(da).getTime() - new Date(db).getTime();
    })
    .slice(0, 5);

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '120px', borderRadius: '16px' }} />
          ))}
        </div>
        <div className="skeleton" style={{ height: '300px', borderRadius: '16px' }} />
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass" style={{ maxWidth: '480px', margin: '0 auto', padding: '3rem 2rem' }}>
          <BookOpen size={48} color="#1E7B45" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ color: '#0F172A', fontWeight: 700, fontSize: '1.5rem', marginBottom: '0.75rem' }}>No courses yet</h2>
          <p style={{ color: '#4B5563', marginBottom: '2rem' }}>Upload your first syllabus to get started</p>
          <Link href="/upload" className="btn-primary" style={{ justifyContent: 'center' }}>
            <Upload size={16} /> Upload Syllabus
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.25rem' }}>Dashboard</h1>
            <p style={{ color: '#4B5563', fontSize: '0.9rem' }}>{courses.length} course{courses.length !== 1 ? 's' : ''} loaded</p>
          </div>
          <Link href="/upload" className="btn-primary" style={{ fontSize: '0.875rem', padding: '0.6rem 1.25rem' }}>
            <Upload size={14} /> Upload More
          </Link>
        </div>
      </div>

      {/* Stats */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}
      >
        <motion.div variants={itemVariants}><StatCard icon={BookOpen} label="Courses" value={courses.length} color="#1E7B45" href="/course" /></motion.div>
        <motion.div variants={itemVariants}><StatCard icon={ClipboardList} label="Assignments" value={allAssignments.length} color="#0F4C3A" href="/kanban" /></motion.div>
        <motion.div variants={itemVariants}><StatCard icon={GraduationCap} label="Exams" value={allExams.length} color="#80C242" href="/calendar" /></motion.div>
        <motion.div variants={itemVariants}><StatCard icon={TrendingUp} label="Completion" value={`${completionPct}%`} color="#16A34A" /></motion.div>
      </motion.div>

      {/* Completion bar */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="glass" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ color: '#0F172A', fontWeight: 600, fontSize: '0.9rem' }}>Overall Progress</span>
          <span style={{ color: '#1E7B45', fontWeight: 700 }}>{completionPct}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${completionPct}%` }} />
        </div>
        <p style={{ color: '#6B7280', fontSize: '0.8rem', marginTop: '0.4rem' }}>{completed} of {allAssignments.length} assignments completed</p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Courses */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass" style={{ padding: '1.5rem' }}>
          <h2 style={{ color: '#0F172A', fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={16} color="#1E7B45" /> My Courses
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {courses.map((c) => (
              <Link key={c.id} href={`/course/${c.id}`} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem', borderRadius: '10px',
                background: 'rgba(128,194,66,0.1)',
                border: '1px solid rgba(128,194,66,0.3)',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}>
                <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg,#0F4C3A,#1E7B45)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BookOpen size={16} color="#fff" />
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ color: '#0F172A', fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                  <div style={{ color: '#4B5563', fontSize: '0.75rem' }}>{c.course_code} · {c.semester}</div>
                </div>
                <ArrowRight size={14} color="#6B7280" />
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Upcoming */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass" style={{ padding: '1.5rem' }}>
          <h2 style={{ color: '#0F172A', fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={16} color="#F59E0B" /> Upcoming Deadlines
          </h2>
          {upcoming.length === 0 ? (
            <p style={{ color: '#4B5563', fontSize: '0.875rem' }}>No upcoming deadlines</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {upcoming.map((item, i) => {
                const isExam = 'type' in item && !('status' in item);
                const date = isExam ? (item as Exam).date : (item as Assignment).deadline;
                const title = isExam ? `${(item as Exam).type} Exam` : (item as Assignment).title;
                const daysLeft = date ? Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '10px', background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                    <Calendar size={16} color={isExam ? '#DC2626' : '#1E7B45'} />
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ color: '#0F172A', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
                      {date && <div style={{ color: '#4B5563', fontSize: '0.75rem' }}>{new Date(date).toLocaleDateString()}</div>}
                    </div>
                    {daysLeft !== null && (
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 600, borderRadius: '6px', padding: '2px 8px',
                        background: daysLeft <= 3 ? 'rgba(220,38,38,0.1)' : daysLeft <= 7 ? 'rgba(245,158,11,0.1)' : 'rgba(22,163,74,0.1)',
                        color: daysLeft <= 3 ? '#DC2626' : daysLeft <= 7 ? '#D97706' : '#16A34A',
                      }}>
                        {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft}d`}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
