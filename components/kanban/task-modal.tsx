import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Edit2, Save, Trash, Clock, FileText, Bot, User as UserIcon, Tag } from 'lucide-react';
import { useColors } from '@/lib/useColors';
import type { KanbanCard, Course } from '@/types';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: KanbanCard | null;
  workspaceId: string;
}

export function TaskModal({ isOpen, onClose, task, workspaceId }: TaskModalProps) {
  const colors = useColors();
  const queryClient = useQueryClient();
  const isCreateMode = !task;
  const [isEditMode, setIsEditMode] = useState(isCreateMode);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [courseId, setCourseId] = useState('');
  const [type, setType] = useState('task');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('todo');
  const [dueDate, setDueDate] = useState('');

  // Fetch courses for dropdown
  const { data: coursesData } = useQuery<{ courses: Course[] }>({
    queryKey: ['courses', workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/courses?workspace_id=${workspaceId}`);
      if (!res.ok) throw new Error('Failed to fetch courses');
      return res.json();
    },
    enabled: isOpen && !!workspaceId,
  });

  const courses = coursesData?.courses || [];

  useEffect(() => {
    if (isOpen) {
      if (task) {
        setTitle(task.title || '');
        setDescription(task.description || '');
        setNotes(task.notes || '');
        setCourseId(task.course_id || '');
        setType(task.type || 'task');
        setPriority(task.priority || 'medium');
        setStatus(task.status || 'todo');
        setDueDate(task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '');
        setIsEditMode(false);
      } else {
        setTitle('');
        setDescription('');
        setNotes('');
        setCourseId(courses.length > 0 ? courses[0].id : '');
        setType('task');
        setPriority('medium');
        setStatus('todo');
        setDueDate('');
        setIsEditMode(true);
      }
    }
  }, [isOpen, task, courses]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const method = isCreateMode ? 'POST' : 'PATCH';
      const url = '/api/kanban';
      const body = isCreateMode ? { ...data } : { id: task!.id, ...data };
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to save task');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      toast.success(isCreateMode ? 'Task created successfully' : 'Task updated successfully');
      onClose();
    },
    onError: () => {
      toast.error('Failed to save task');
    }
  });

  const handleSave = () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!courseId) {
      toast.error('Course is required');
      return;
    }

    saveMutation.mutate({
      title,
      description,
      notes,
      course_id: courseId,
      type,
      priority,
      status,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
    });
  };

  const handleClose = () => {
    setIsEditMode(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{
              position: 'fixed',
              inset: 0,
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
              position: 'fixed',
              top: '5%',
              left: '50%',
              width: '95%',
              maxWidth: '800px',
              maxHeight: '90vh',
              background: colors.surfaceDeep,
              border: `1px solid ${colors.border}`,
              borderRadius: '16px',
              boxShadow: colors.isDark ? '0 24px 48px rgba(0,0,0,0.5)' : '0 24px 48px rgba(15,76,58,0.2)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{ padding: '1.5rem', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: colors.surface }}>
              <div style={{ flex: 1, marginRight: '1rem' }}>
                {isEditMode ? (
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Task Title"
                    style={{ width: '100%', fontSize: '1.5rem', fontWeight: 800, color: colors.text, background: 'transparent', border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '0.5rem', outline: 'none' }}
                  />
                ) : (
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: colors.text, margin: 0 }}>{title}</h2>
                )}
                
                {!isCreateMode && !isEditMode && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                     <span className={`badge-${status}`} style={{ fontSize: '0.75rem' }}>{status.toUpperCase()}</span>
                     <span className={`badge-${priority}`} style={{ fontSize: '0.75rem' }}>{priority.toUpperCase()}</span>
                     {task?.courses && (
                       <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '100px', background: 'rgba(30,123,69,0.1)', color: '#1E7B45', fontWeight: 600 }}>
                         {task.courses.course_code || task.courses.title}
                       </span>
                     )}
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: colors.textMuted, marginLeft: 'auto' }}>
                       {task?.source === 'Manual' ? <UserIcon size={12} /> : <Bot size={12} />}
                       <span>Source: {task?.source === 'Manual' ? 'Manual' : 'AI Generated'}</span>
                     </div>
                  </div>
                )}
              </div>
              <button onClick={handleClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: colors.textMuted }}>
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {isEditMode ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: colors.textMuted, marginBottom: '0.5rem' }}>Course</label>
                    <select value={courseId} onChange={e => setCourseId(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, outline: 'none' }}>
                      <option value="" disabled>Select Course</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.title} ({c.course_code})</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: colors.textMuted, marginBottom: '0.5rem' }}>Task Type</label>
                    <select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, outline: 'none' }}>
                      <option value="task">Personal Task</option>
                      <option value="assignment">Assignment</option>
                      <option value="quiz">Quiz</option>
                      <option value="project">Project</option>
                      <option value="exam">Exam</option>
                      <option value="reading">Reading</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: colors.textMuted, marginBottom: '0.5rem' }}>Status</label>
                    <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, outline: 'none' }}>
                      <option value="todo">To Do</option>
                      <option value="doing">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: colors.textMuted, marginBottom: '0.5rem' }}>Priority</label>
                    <select value={priority} onChange={e => setPriority(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, outline: 'none' }}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: colors.textMuted, marginBottom: '0.5rem' }}>Deadline</label>
                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, outline: 'none' }} />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                  {dueDate && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: colors.text }}>
                      <Calendar size={18} color={colors.textMuted} />
                      <span style={{ fontWeight: 600 }}>Due:</span>
                      <span>{new Date(dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {type && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: colors.text }}>
                      <Tag size={18} color={colors.textMuted} />
                      <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{type}</span>
                    </div>
                  )}
                  {task?.updated_at && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: colors.textMuted, fontSize: '0.8rem' }}>
                      <Clock size={16} />
                      <span>Last updated: {new Date(task.updated_at).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 700, color: colors.text, marginBottom: '0.75rem' }}>
                  <FileText size={18} /> Description
                </label>
                {isEditMode ? (
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Enter task description (extracted or manual)..."
                    rows={5}
                    style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, resize: 'vertical', outline: 'none' }}
                  />
                ) : (
                  <div style={{ background: colors.surface, padding: '1rem', borderRadius: '12px', border: `1px solid ${colors.border}`, color: colors.textSubtle, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {description || 'No description provided.'}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 700, color: colors.text, marginBottom: '0.75rem' }}>
                  <Edit2 size={18} /> Personal Notes
                </label>
                {isEditMode ? (
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Add any personal notes here..."
                    rows={3}
                    style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: `1px solid ${colors.border}`, background: '#FFFDF0', color: '#333', borderLeft: '4px solid #FDE047', outline: 'none', resize: 'vertical' }}
                  />
                ) : (
                  notes ? (
                    <div style={{ background: '#FFFDF0', padding: '1rem', borderRadius: '12px', color: '#333', borderLeft: '4px solid #FDE047', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                      {notes}
                    </div>
                  ) : (
                    <p style={{ color: colors.textMuted, fontStyle: 'italic' }}>No personal notes added.</p>
                  )
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: `1px solid ${colors.border}`, background: colors.surface, display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              {!isCreateMode && !isEditMode && (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1E7B45' }}
                >
                  <Edit2 size={16} /> Edit Task
                </button>
              )}
              {isEditMode && (
                <>
                  {!isCreateMode && (
                    <button
                      onClick={() => setIsEditMode(false)}
                      style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: `1px solid ${colors.border}`, background: 'transparent', color: colors.text, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1E7B45', opacity: saveMutation.isPending ? 0.7 : 1 }}
                  >
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
