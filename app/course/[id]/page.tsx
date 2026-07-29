'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWorkspaceId } from '@/lib/workspace';
import { use, Suspense } from 'react';
import { BookOpen, User, Calendar as CalIcon, Clock, ChevronRight, FileText, CheckCircle, Circle, Target, Search } from 'lucide-react';
import type { Course, Topic } from '@/types';
import { useColors } from '@/lib/useColors';
import { TopicModal } from '@/components/course/topic-modal';

function CourseContent({ id }: { id: string }) {
  const [workspaceId, setWorkspaceId] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'assignments' | 'topics'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Topic Modal State
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const colors = useColors();

  useEffect(() => {
    setWorkspaceId(getWorkspaceId());
  }, []);

  const { data, isLoading, error } = useQuery<{ course: Course }>({
    queryKey: ['course', id, workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${id}?workspace_id=${workspaceId}`);
      if (!res.ok) throw new Error('Failed to fetch course');
      return res.json();
    },
    enabled: !!workspaceId,
  });

  if (isLoading) return (
    <div className="container" style={{ padding: '2rem' }}>
      <div className="skeleton" style={{ height: '200px', borderRadius: '16px', marginBottom: '2rem' }} />
      <div className="skeleton" style={{ height: '400px', borderRadius: '16px' }} />
    </div>
  );

  if (error || !data?.course) return (
    <div className="container" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
      <p style={{ color: '#ef4444' }}>Error loading course details.</p>
    </div>
  );

  const course = data.course;
  const assignments = course.assignments || [];
  const topics = course.topics || [];
  
  const filteredTopics = topics.filter((t: Topic) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.topic || '').toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q) ||
      (t.learning_objectives || '').toLowerCase().includes(q) ||
      (t.covered_concepts || '').toLowerCase().includes(q) ||
      (t.reading_materials || '').toLowerCase().includes(q) ||
      (t.notes || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div className="glass" style={{ padding: '2rem', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, opacity: 0.05, transform: 'translate(20%, -20%)' }}>
          <BookOpen size={200} color="#80C242" />
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(128,194,66,0.15)', color: '#0F4C3A', padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem' }}>
            {course.course_code} • {course.semester} • {course.credits} Credits
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: colors.text, marginBottom: '0.5rem', lineHeight: 1.2 }}>
            {course.title}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: colors.textMuted, fontSize: '0.9rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <User size={16} /> {course.instructor || 'Instructor TBA'}
            </span>
          </div>
          {course.description && (
             <p style={{ marginTop: '1.5rem', color: colors.textMuted, lineHeight: 1.6, maxWidth: '800px' }}>
               {course.description}
             </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '1rem' }}>
        {(['overview', 'assignments', 'topics'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer',
              color: activeTab === tab ? '#0F4C3A' : colors.textSubtle,
              fontWeight: activeTab === tab ? 600 : 400,
              position: 'relative',
              textTransform: 'capitalize'
            }}
          >
            {tab}
            {activeTab === tab && (
              <div style={{ position: 'absolute', bottom: '-17px', left: 0, right: 0, height: '2px', background: '#80C242', borderRadius: '2px' }} />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="glass" style={{ padding: '1.5rem' }}>
        {activeTab === 'overview' && (
           <div>
             <h3 style={{ color: colors.text, fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Syllabus Summary</h3>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
               <div style={{ background: colors.surfaceAlt, padding: '1rem', borderRadius: '12px', border: `1px solid ${colors.border}`, boxShadow: colors.card.boxShadow }}>
                 <div style={{ color: '#0F4C3A', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>TOTAL ASSIGNMENTS</div>
                 <div style={{ fontSize: '1.75rem', color: colors.text, fontWeight: 800 }}>{assignments.length}</div>
               </div>
               <div style={{ background: colors.surfaceAlt, padding: '1rem', borderRadius: '12px', border: `1px solid ${colors.border}`, boxShadow: colors.card.boxShadow }}>
                 <div style={{ color: '#DC2626', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>TOTAL EXAMS</div>
                 <div style={{ fontSize: '1.75rem', color: colors.text, fontWeight: 800 }}>{course.exams?.length || 0}</div>
               </div>
               <div style={{ background: colors.surfaceAlt, padding: '1rem', borderRadius: '12px', border: `1px solid ${colors.border}`, boxShadow: colors.card.boxShadow }}>
                 <div style={{ color: '#16A34A', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>COURSE TOPICS</div>
                 <div style={{ fontSize: '1.75rem', color: colors.text, fontWeight: 800 }}>{topics.length}</div>
               </div>
             </div>
           </div>
        )}

        {activeTab === 'assignments' && (
          <div>
            {assignments.length === 0 ? <p style={{ color: colors.textMuted }}>No assignments extracted.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {assignments.map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: colors.surfaceAlt, borderRadius: '10px', border: `1px solid ${colors.border}` }}>
                    <div>
                      <div style={{ color: colors.text, fontWeight: 600, marginBottom: '0.25rem' }}>{a.title}</div>
                      <div style={{ color: colors.textMuted, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {a.deadline && <><CalIcon size={14}/> {new Date(a.deadline).toLocaleDateString()}</>}
                        {a.weight > 0 && <span style={{ padding: '2px 6px', background: 'rgba(30,123,69,0.1)', color: '#1E7B45', borderRadius: '4px', fontSize: '0.75rem' }}>{a.weight}% of grade</span>}
                      </div>
                    </div>
                    {a.status === 'completed' ? <CheckCircle color="#16A34A" /> : <Circle color="#D1D5DB" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'topics' && (
          <div>
            <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
              <Search size={18} color={colors.textMuted} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search topics, description, concepts..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.surfaceAlt, color: colors.text, outline: 'none' }}
              />
            </div>
            
            {filteredTopics.length === 0 ? <p style={{ color: colors.textMuted }}>No topics found.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredTopics.map((t: Topic) => (
                  <div 
                    key={t.id} 
                    onClick={() => { setSelectedTopic(t); setIsTopicModalOpen(true); }}
                    style={{ padding: '1.5rem', background: colors.surfaceAlt, borderRadius: '12px', border: `1px solid ${colors.border}`, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ color: '#1E7B45', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', display: 'inline-block', padding: '4px 8px', background: 'rgba(30,123,69,0.1)', borderRadius: '100px' }}>WEEK {t.week}</div>
                        <div style={{ color: colors.text, fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.5rem' }}>{t.topic}</div>
                        {t.description && <p style={{ color: colors.textMuted, fontSize: '0.9rem', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.description}</p>}
                        
                        <div style={{ display: 'flex', gap: '1.5rem', color: colors.textSubtle, fontSize: '0.85rem' }}>
                          {t.reading_materials && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <BookOpen size={14} /> Reading
                            </span>
                          )}
                          {t.learning_objectives && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Target size={14} /> Objectives
                            </span>
                          )}
                          {(t.notes || t.edited_by_user) && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <FileText size={14} /> Notes
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight color={colors.border} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <TopicModal 
        isOpen={isTopicModalOpen}
        onClose={() => setIsTopicModalOpen(false)}
        topic={selectedTopic}
        allTopics={topics}
        allAssignments={assignments}
        allExams={course.exams || []}
        onNavigate={(topic) => setSelectedTopic(topic)}
      />
    </div>
  );
}

export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <Suspense fallback={<div className="container" style={{ padding: '2rem' }}><div className="skeleton" style={{ height: '300px' }} /></div>}>
      <CourseContent id={id} />
    </Suspense>
  );
}
