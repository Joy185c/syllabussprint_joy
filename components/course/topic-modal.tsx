import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit2, Save, Clock, FileText, Bot, User as UserIcon, BookOpen, Target, Lightbulb, ChevronLeft, ChevronRight, Activity, Calendar, Layout } from 'lucide-react';
import { useColors } from '@/lib/useColors';
import type { Topic, Assignment, Exam } from '@/types';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface TopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: Topic | null;
  allTopics: Topic[];
  allAssignments: Assignment[];
  allExams: Exam[];
  onNavigate: (topic: Topic) => void;
}

export function TopicModal({ isOpen, onClose, topic, allTopics, allAssignments, allExams, onNavigate }: TopicModalProps) {
  const colors = useColors();
  const queryClient = useQueryClient();
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Form State
  const [topicTitle, setTopicTitle] = useState('');
  const [description, setDescription] = useState('');
  const [learningObjectives, setLearningObjectives] = useState('');
  const [coveredConcepts, setCoveredConcepts] = useState('');
  const [readingMaterials, setReadingMaterials] = useState('');
  const [referencesText, setReferencesText] = useState('');
  const [labActivity, setLabActivity] = useState('');
  const [deliverables, setDeliverables] = useState('');
  const [notes, setNotes] = useState('');
  const [week, setWeek] = useState(1);

  useEffect(() => {
    if (isOpen && topic) {
      setTopicTitle(topic.topic || '');
      setDescription(topic.description || '');
      setLearningObjectives(topic.learning_objectives || '');
      setCoveredConcepts(topic.covered_concepts || '');
      setReadingMaterials(topic.reading_materials || '');
      setReferencesText(topic.reference_books || '');
      setLabActivity(topic.lab_activities || '');
      setDeliverables(topic.deliverables || '');
      setNotes(topic.notes || '');
      setWeek(topic.week || 1);
      setIsEditMode(false);
    }
  }, [isOpen, topic]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/topics', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: topic!.id, ...data }),
      });
      if (!res.ok) throw new Error('Failed to save topic');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course'] });
      toast.success('Topic updated successfully');
      setIsEditMode(false);
    },
    onError: () => {
      toast.error('Failed to update topic');
    }
  });

  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/topics/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic_id: topic!.id, force: true }),
      });
      if (!res.ok) throw new Error('Failed to regenerate AI insights');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course'] });
      toast.success('AI insights regenerated successfully');
    },
    onError: () => {
      toast.error('Failed to regenerate AI insights');
    }
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/topics/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic_id: topic!.id }),
      });
      if (!res.ok) throw new Error('Failed to reset AI insights');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course'] });
      toast.success('AI insights reset successfully');
    },
    onError: () => {
      toast.error('Failed to reset AI insights');
    }
  });

  const handleSave = () => {
    if (!topicTitle.trim()) {
      toast.error('Title is required');
      return;
    }
    saveMutation.mutate({
      topic: topicTitle,
      description,
      learning_objectives: learningObjectives,
      covered_concepts: coveredConcepts,
      reading_materials: readingMaterials,
      reference_books: referencesText,
      lab_activities: labActivity,
      deliverables,
      notes,
      week,
    });
  };

  if (!topic) return null;

  const currentIndex = allTopics.findIndex(t => t.id === topic.id);
  const prevTopic = currentIndex > 0 ? allTopics[currentIndex - 1] : null;
  const nextTopic = currentIndex < allTopics.length - 1 ? allTopics[currentIndex + 1] : null;

  // Simple heuristic for related items
  const isRelated = (text: string, query: string) => text.toLowerCase().includes(query.toLowerCase());
  const relatedAssignments = allAssignments.filter(a => isRelated(a.title, topic.topic) || isRelated(topic.topic, a.title));
  const relatedExams = allExams.filter(e => isRelated(e.type, topic.topic) || isRelated(topic.topic, e.type));

  const renderTextField = (label: string, icon: React.ReactNode, value: string, setValue: (v: string) => void, isNotes = false) => {
    if (!isEditMode && !value) return null;
    return (
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 700, color: colors.text, marginBottom: '0.75rem' }}>
          {icon} {label}
        </label>
        {isEditMode ? (
          <textarea
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}...`}
            rows={4}
            style={{ 
              width: '100%', padding: '1rem', borderRadius: '12px', 
              border: `1px solid ${colors.border}`, 
              background: isNotes ? '#FFFDF0' : colors.surface, 
              color: isNotes ? '#333' : colors.text, 
              borderLeft: isNotes ? '4px solid #FDE047' : undefined,
              resize: 'vertical', outline: 'none' 
            }}
          />
        ) : (
          <div style={{ 
            background: isNotes ? '#FFFDF0' : colors.surface, 
            padding: '1rem', borderRadius: '12px', 
            border: `1px solid ${colors.border}`, 
            borderLeft: isNotes ? '4px solid #FDE047' : undefined,
            color: isNotes ? '#333' : colors.textSubtle, 
            whiteSpace: 'pre-wrap', lineHeight: 1.6 
          }}>
            {value}
          </div>
        )}
      </div>
    );
  };

  const renderBulletList = (label: string, items?: string[]) => {
    if (!items || items.length === 0) return null;
    return (
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontWeight: 700, color: colors.text, marginBottom: '0.5rem' }}>{label}</div>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: colors.text, lineHeight: 1.6 }}>
          {items.map((item, i) => (
            <li key={i} style={{ marginBottom: '0.25rem' }}>{item}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { if (!isEditMode) onClose(); }}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 999,
            }}
          />
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, y: 20, scale: 0.95, x: "-50%" }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed', top: '5%', left: '50%',
              width: '95%', maxWidth: '1000px', maxHeight: '90vh',
              background: colors.surfaceDeep,
              border: `1px solid ${colors.border}`,
              borderRadius: '16px',
              boxShadow: colors.isDark ? '0 24px 48px rgba(0,0,0,0.5)' : '0 24px 48px rgba(15,76,58,0.2)',
              zIndex: 1000, display: 'flex', flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{ padding: '1.5rem', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: colors.surface }}>
              <div style={{ flex: 1, marginRight: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '100px', background: 'rgba(30,123,69,0.1)', color: '#1E7B45', fontWeight: 800 }}>
                    WEEK {isEditMode ? <input type="number" value={week} onChange={e => setWeek(Number(e.target.value))} style={{ width: '40px', background: 'transparent', border: 'none', color: 'inherit', fontWeight: 'inherit', outline: 'none' }} /> : week}
                  </span>
                </div>
                {isEditMode ? (
                  <input
                    type="text"
                    value={topicTitle}
                    onChange={e => setTopicTitle(e.target.value)}
                    style={{ width: '100%', fontSize: '1.75rem', fontWeight: 800, color: colors.text, background: 'transparent', border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '0.5rem', outline: 'none' }}
                  />
                ) : (
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: colors.text, margin: 0 }}>{topicTitle}</h2>
                )}
                
                {!isEditMode && (
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: colors.textMuted }}>
                       {topic.edited_by_user ? <UserIcon size={14} /> : <Bot size={14} />}
                       <span>Source: {topic.edited_by_user ? 'AI Extracted (Manually Edited)' : 'AI Extracted'}</span>
                     </div>
                     {topic.updated_at && (
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: colors.textMuted }}>
                         <Clock size={14} />
                         <span>Last updated: {new Date(topic.updated_at).toLocaleDateString()}</span>
                       </div>
                     )}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: colors.textMuted }}>
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Content Body - Split Layout */}
            <div style={{ display: 'flex', flexWrap: 'wrap', flex: 1, overflowY: 'auto' }}>
              {/* Left Column - Main Details */}
              <div style={{ flex: '1 1 500px', padding: '1.5rem', borderRight: `1px solid ${colors.border}` }}>
                
                {/* Extracted Syllabus Section */}
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: colors.text, fontSize: '1.1rem', fontWeight: 800 }}>
                    📄 Extracted from Uploaded Syllabus
                  </div>
                  
                  {(!description && !learningObjectives && !coveredConcepts && !readingMaterials && !referencesText && !labActivity && !deliverables && !notes) && !isEditMode ? (
                    <div style={{ color: colors.textMuted, fontStyle: 'italic', padding: '1rem', background: colors.surfaceAlt, borderRadius: '8px' }}>
                      No detailed information was found in the uploaded syllabus.
                    </div>
                  ) : (
                    <>
                      {renderTextField('Description', <FileText size={18} />, description, setDescription)}
                      {renderTextField('Learning Objectives', <Target size={18} />, learningObjectives, setLearningObjectives)}
                      {renderTextField('Covered Concepts', <Lightbulb size={18} />, coveredConcepts, setCoveredConcepts)}
                      {renderTextField('Reading Materials', <BookOpen size={18} />, readingMaterials, setReadingMaterials)}
                      {renderTextField('Lab / Class Activities', <Activity size={18} />, labActivity, setLabActivity)}
                      {renderTextField('Deliverables', <Layout size={18} />, deliverables, setDeliverables)}
                      {renderTextField('Personal Notes', <Edit2 size={18} />, notes, setNotes, true)}
                    </>
                  )}
                </div>

                {/* AI Generated Overview Section */}
                {!isEditMode && (
                  <div style={{ background: 'rgba(30,123,69,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(30,123,69,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1E7B45', fontSize: '1.1rem', fontWeight: 800 }}>
                        🤖 AI Learning Assistant
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                         <button 
                           onClick={() => regenerateMutation.mutate()} 
                           disabled={regenerateMutation.isPending}
                           style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '6px', background: 'transparent', border: `1px solid ${colors.border}`, color: colors.text, cursor: regenerateMutation.isPending ? 'not-allowed' : 'pointer' }}
                         >
                           {regenerateMutation.isPending ? 'Regenerating...' : 'Regenerate AI'}
                         </button>
                         {(topic.ai_status === 'completed' || topic.ai_status === 'failed') && (
                           <button 
                             onClick={() => resetMutation.mutate()} 
                             disabled={resetMutation.isPending}
                             style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '6px', background: 'transparent', border: `1px solid ${colors.border}`, color: '#DC2626', cursor: resetMutation.isPending ? 'not-allowed' : 'pointer' }}
                           >
                             Reset AI
                           </button>
                         )}
                      </div>
                    </div>
                    
                    {topic.ai_status === 'failed' && (
                      <div style={{ background: '#FEF2F2', padding: '1rem', borderRadius: '8px', border: '1px solid #FCA5A5', color: '#991B1B', marginBottom: '1rem' }}>
                        AI learning guide could not be generated. You can still access the original syllabus information.
                        <button onClick={() => regenerateMutation.mutate()} style={{ marginLeft: '1rem', padding: '0.25rem 0.75rem', background: '#DC2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Retry</button>
                      </div>
                    )}

                    {(topic.ai_status === 'queued' || topic.ai_status === 'generating' || topic.ai_status === 'idle') && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ height: '20px', width: '40%', background: colors.border, borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div>
                        <div style={{ height: '60px', width: '100%', background: colors.border, borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div>
                        <div style={{ height: '40px', width: '60%', background: colors.border, borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div>
                        <div style={{ color: colors.textMuted, fontSize: '0.9rem', fontStyle: 'italic', marginTop: '0.5rem' }}>Generating AI Learning Guide...</div>
                      </div>
                    )}

                    {topic.ai_status === 'completed' && topic.ai_summary && (
                      <>
                        <div style={{ marginBottom: '1.5rem' }}>
                          <div style={{ fontWeight: 700, color: colors.text, marginBottom: '0.5rem' }}>Topic Summary</div>
                          <div style={{ color: colors.text, lineHeight: 1.6 }}>{topic.ai_summary}</div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                          {topic.difficulty_level && (
                             <div style={{ background: colors.surface, padding: '0.5rem 1rem', borderRadius: '8px', border: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column' }}>
                               <span style={{ fontSize: '0.7rem', fontWeight: 700, color: colors.textMuted }}>DIFFICULTY LEVEL</span>
                               <span style={{ fontWeight: 600, color: colors.text }}>{topic.difficulty_level}</span>
                             </div>
                          )}
                          {topic.estimated_study_time && (
                             <div style={{ background: colors.surface, padding: '0.5rem 1rem', borderRadius: '8px', border: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column' }}>
                               <span style={{ fontSize: '0.7rem', fontWeight: 700, color: colors.textMuted }}>ESTIMATED STUDY TIME</span>
                               <span style={{ fontWeight: 600, color: colors.text }}>{topic.estimated_study_time}</span>
                             </div>
                          )}
                        </div>

                        {renderBulletList('Key Concepts', topic.ai_key_concepts)}
                        {renderBulletList('Learning Outcomes', topic.ai_learning_outcomes)}
                        {renderBulletList('Recommended Practice', topic.ai_practice)}
                        {renderBulletList('Study Tips', topic.ai_study_tips)}
                        {renderBulletList('Common Mistakes', topic.ai_common_mistakes)}
                        
                        <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: `1px dashed rgba(30,123,69,0.2)`, fontSize: '0.75rem', color: colors.textMuted, display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                          <span>Provider: {topic.ai_provider}</span>
                          <span>Model: {topic.ai_model}</span>
                          <span>Version: {topic.ai_version}</span>
                          {topic.ai_generated_on && <span>Generated: {new Date(topic.ai_generated_on).toLocaleDateString()}</span>}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column - Related Items & Navigation */}
              <div style={{ flex: '1 1 250px', padding: '1.5rem', background: colors.surfaceAlt, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: colors.text, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} /> Related Items
                </h3>
                
                {relatedAssignments.length === 0 && relatedExams.length === 0 && (
                  <p style={{ color: colors.textMuted, fontSize: '0.9rem', fontStyle: 'italic' }}>No explicitly related assignments or exams found for this topic.</p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                  {relatedAssignments.map(a => (
                    <div key={a.id} style={{ background: colors.surface, padding: '0.75rem', borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                       <div style={{ fontSize: '0.7rem', color: '#1E7B45', fontWeight: 700, marginBottom: '0.25rem' }}>ASSIGNMENT</div>
                       <div style={{ color: colors.text, fontWeight: 600, fontSize: '0.9rem' }}>{a.title}</div>
                    </div>
                  ))}
                  {relatedExams.map(e => (
                    <div key={e.id} style={{ background: colors.surface, padding: '0.75rem', borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                       <div style={{ fontSize: '0.7rem', color: '#DC2626', fontWeight: 700, marginBottom: '0.25rem' }}>EXAM</div>
                       <div style={{ color: colors.text, fontWeight: 600, fontSize: '0.9rem', textTransform: 'capitalize' }}>{e.type}</div>
                    </div>
                  ))}
                </div>

                {/* Navigation */}
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                   {prevTopic && (
                     <button onClick={() => onNavigate(prevTopic)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, cursor: 'pointer', textAlign: 'left' }}>
                       <ChevronLeft size={16} />
                       <div>
                         <div style={{ fontSize: '0.7rem', color: colors.textMuted, fontWeight: 600 }}>PREVIOUS TOPIC</div>
                         <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prevTopic.topic}</div>
                       </div>
                     </button>
                   )}
                   {nextTopic && (
                     <button onClick={() => onNavigate(nextTopic)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, cursor: 'pointer', textAlign: 'right', justifyContent: 'flex-end' }}>
                       <div>
                         <div style={{ fontSize: '0.7rem', color: colors.textMuted, fontWeight: 600 }}>NEXT TOPIC</div>
                         <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nextTopic.topic}</div>
                       </div>
                       <ChevronRight size={16} />
                     </button>
                   )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: `1px solid ${colors.border}`, background: colors.surface, display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              {!isEditMode && (
                <button onClick={() => setIsEditMode(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1E7B45' }}>
                  <Edit2 size={16} /> Edit Topic
                </button>
              )}
              {isEditMode && (
                <>
                  <button onClick={() => setIsEditMode(false)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: `1px solid ${colors.border}`, background: 'transparent', color: colors.text, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={saveMutation.isPending} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1E7B45', opacity: saveMutation.isPending ? 0.7 : 1 }}>
                    <Save size={16} /> {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              )}
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
