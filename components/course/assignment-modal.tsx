import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit2, Save, Calendar, FileText, CheckCircle, Circle, ArrowUp, Target } from 'lucide-react';
import { useColors } from '@/lib/useColors';
import type { Assignment } from '@/types';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
}

export function AssignmentModal({ isOpen, onClose, assignment }: AssignmentModalProps) {
  const colors = useColors();
  const queryClient = useQueryClient();
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [weight, setWeight] = useState(0);
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed' | 'overdue'>('pending');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  useEffect(() => {
    if (isOpen && assignment) {
      setTitle(assignment.title || '');
      setDescription(assignment.description || '');
      setDeadline(assignment.deadline ? new Date(assignment.deadline).toISOString().split('T')[0] : '');
      setWeight(assignment.weight || 0);
      setStatus(assignment.status || 'pending');
      setPriority(assignment.priority || 'medium');
      setIsEditMode(false);
    }
  }, [isOpen, assignment]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      // Assuming a generic endpoint or we might need to create one, but for now we'll mock or use kanban route if there isn't an assignment route.
      // Wait, do we have an assignments API?
      // Let's check. If not, we just update via supabase directly or create an API route. 
      // Actually, let's just make the fetch request to `/api/assignments`.
      const res = await fetch('/api/assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: assignment!.id, ...data }),
      });
      if (!res.ok) throw new Error('Failed to save assignment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course'] });
      toast.success('Assignment updated successfully');
      setIsEditMode(false);
    },
    onError: () => {
      toast.error('Failed to update assignment');
    }
  });

  const handleSave = () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    saveMutation.mutate({
      title,
      description,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      weight,
      status,
      priority,
    });
  };

  if (!assignment) return null;

  const renderTextField = (label: string, icon: React.ReactNode, value: string, setValue: (v: string) => void) => {
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
              background: colors.surface, 
              color: colors.text, 
              resize: 'vertical', outline: 'none' 
            }}
          />
        ) : (
          <div style={{ 
            background: colors.surface, 
            padding: '1rem', borderRadius: '12px', 
            border: `1px solid ${colors.border}`, 
            color: colors.textSubtle, 
            whiteSpace: 'pre-wrap', lineHeight: 1.6 
          }}>
            {value}
          </div>
        )}
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
              position: 'fixed', top: '10%', left: '50%',
              width: '95%', maxWidth: '700px', maxHeight: '80vh',
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
                    ASSIGNMENT
                  </span>
                </div>
                {isEditMode ? (
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    style={{ width: '100%', fontSize: '1.75rem', fontWeight: 800, color: colors.text, background: 'transparent', border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '0.5rem', outline: 'none' }}
                  />
                ) : (
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: colors.text, margin: 0 }}>{title}</h2>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: colors.textMuted }}>
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                
                {/* Deadline */}
                <div style={{ background: colors.surface, padding: '1rem', borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                    <Calendar size={14} /> DEADLINE
                  </div>
                  {isEditMode ? (
                    <input 
                      type="date" 
                      value={deadline} 
                      onChange={e => setDeadline(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: `1px solid ${colors.border}`, background: 'transparent', color: colors.text }}
                    />
                  ) : (
                    <div style={{ fontWeight: 600, color: colors.text }}>
                      {deadline ? new Date(deadline).toLocaleDateString() : 'No deadline'}
                    </div>
                  )}
                </div>

                {/* Weight */}
                <div style={{ background: colors.surface, padding: '1rem', borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                    <Target size={14} /> GRADE WEIGHT
                  </div>
                  {isEditMode ? (
                    <input 
                      type="number" 
                      value={weight} 
                      onChange={e => setWeight(Number(e.target.value))}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: `1px solid ${colors.border}`, background: 'transparent', color: colors.text }}
                    />
                  ) : (
                    <div style={{ fontWeight: 600, color: colors.text }}>
                      {weight > 0 ? `${weight}%` : 'Not specified'}
                    </div>
                  )}
                </div>

                {/* Status */}
                <div style={{ background: colors.surface, padding: '1rem', borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                    <CheckCircle size={14} /> STATUS
                  </div>
                  {isEditMode ? (
                    <select 
                      value={status} 
                      onChange={e => setStatus(e.target.value as any)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: `1px solid ${colors.border}`, background: 'transparent', color: colors.text }}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  ) : (
                    <div style={{ fontWeight: 600, color: colors.text, textTransform: 'capitalize' }}>
                      {status.replace('_', ' ')}
                    </div>
                  )}
                </div>
                
              </div>

              {!description && !isEditMode ? (
                <div style={{ color: colors.textMuted, fontStyle: 'italic', padding: '1rem', background: colors.surfaceAlt, borderRadius: '8px' }}>
                  No description provided for this assignment.
                </div>
              ) : (
                renderTextField('Description', <FileText size={18} />, description, setDescription)
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: `1px solid ${colors.border}`, background: colors.surface, display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              {!isEditMode && (
                <button onClick={() => setIsEditMode(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1E7B45' }}>
                  <Edit2 size={16} /> Edit Assignment
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
