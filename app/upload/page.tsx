'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Upload, File, X, CheckCircle, AlertCircle, Loader2, Brain, Database, Sparkles } from 'lucide-react';
import { getWorkspaceId } from '@/lib/workspace';
import type { UploadStatus } from '@/types';

const MAX_SIZE = 20 * 1024 * 1024;

const STATUS_STEPS: { key: UploadStatus; label: string; icon: typeof Loader2 }[] = [
  { key: 'uploading', label: 'Uploading file to storage…', icon: Upload },
  { key: 'extracting', label: 'AI reading & extracting syllabus…', icon: Brain },
  { key: 'saving', label: 'Saving to database…', icon: Database },
  { key: 'done', label: 'All done! Redirecting…', icon: CheckCircle },
];

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onDrop = useCallback((accepted: File[], rejected: any[]) => {
    setError(null);
    if (rejected.length > 0) {
      setError('Invalid file type or size. Please upload a supported document or image under 20MB.');
      return;
    }
    if (accepted.length > 0) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'application/pdf': ['.pdf'], 
      'text/markdown': ['.md', '.markdown'], 
      'text/plain': ['.txt', '.csv'], 
      'application/json': ['.json'],
      'application/msword': ['.doc'], 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxSize: MAX_SIZE,
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file) return;
    setError(null);

    try {
      const workspaceId = getWorkspaceId();

      // Step 1: Upload
      setStatus('uploading');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workspace_id', workspaceId);

      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(uploadData.error ?? 'Upload failed');
      }

      // Step 2: Extract
      setStatus('extracting');
      const extractRes = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syllabus_id: uploadData.syllabus_id, workspace_id: workspaceId }),
      });
      const extractData = await extractRes.json();

      if (!extractRes.ok) {
        throw new Error(extractData.error ?? 'AI extraction failed');
      }

      // Step 3: Saving (brief pause for UX)
      setStatus('saving');
      await new Promise((r) => setTimeout(r, 800));

      // Done
      setStatus('done');
      toast.success(`🎉 ${extractData.course_name} processed successfully!`);
      
      if (extractData.start_background_enrichment) {
        // Fire and forget background enrichment
        fetch('/api/topics/enrich-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ course_id: extractData.course_id }),
        }).catch(err => console.error('Background enrichment failed to start:', err));
      }

      await new Promise((r) => setTimeout(r, 1200));
      router.push(`/course/${extractData.course_id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
      setStatus('error');
      toast.error(msg);
    }
  };

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === status);
  const isProcessing = ['uploading', 'extracting', 'saving'].includes(status);

  return (
    <div style={{ minHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="orb orb-1" style={{ opacity: 0.08 }} />
      <div className="orb orb-2" style={{ opacity: 0.08 }} />

      <div style={{ width: '100%', maxWidth: '580px', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: '2rem' }}
        >
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>
            Upload Your <span className="gradient-text">Syllabus</span>
          </h1>
          <p style={{ color: '#4B5563' }}>PDF, DOCX, PPTX, Images, CSV, MD, or TXT — our AI handles the rest</p>
        </motion.div>

        {/* Drop Zone */}
        <AnimatePresence mode="wait">
          {status === 'idle' || status === 'error' ? (
            <motion.div key="dropzone" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div
                {...getRootProps()}
                style={{
                  border: `2px dashed ${isDragActive ? '#80C242' : '#E5E7EB'}`,
                  borderRadius: '20px',
                  padding: '4rem 2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: isDragActive ? 'rgba(128,194,66,0.08)' : '#FFFFFF',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <input {...getInputProps()} />
                <motion.div animate={{ scale: isDragActive ? 1.1 : 1 }}>
                  <div style={{
                    width: '64px', height: '64px',
                    background: 'linear-gradient(135deg, #0F4C3A, #1E7B45)',
                    borderRadius: '16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                    boxShadow: '0 8px 24px rgba(15, 76, 58, 0.15)'
                  }}>
                    <Upload size={28} color="#fff" />
                  </div>
                </motion.div>
                <p style={{ color: '#0F172A', fontWeight: 600, marginBottom: '0.5rem', fontSize: '1.05rem' }}>
                  Drag & drop your syllabus here
                </p>
                <p style={{ color: '#4B5563', fontSize: '0.875rem' }}>or click to browse files</p>
                <p style={{ color: '#6B7280', fontSize: '0.8rem', marginTop: '0.75rem' }}>Supported: PDF, DOC/X, PPT/X, CSV, TXT, MD, Images · Max 20MB</p>
              </div>

              {/* Selected file */}
              {file && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.25rem', marginTop: '1rem' }}
                >
                  <File size={20} color="#1E7B45" />
                  <span style={{ flex: 1, color: '#0F172A', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </span>
                  <span style={{ color: '#4B5563', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '2px' }}
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              )}

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.2)',
                    borderRadius: '12px', padding: '1rem 1.25rem', marginTop: '1rem', color: '#DC2626',
                    fontSize: '0.9rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem'
                  }}
                >
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{error}</span>
                </motion.div>
              )}

              {/* Upload button */}
              <button
                className="btn-primary"
                onClick={handleUpload}
                disabled={!file || isProcessing}
                style={{
                  width: '100%', justifyContent: 'center', marginTop: '1.25rem',
                  opacity: !file ? 0.4 : 1,
                  cursor: !file ? 'not-allowed' : 'pointer',
                  background: '#1E7B45'
                }}
              >
                <Sparkles size={16} />
                Process with AI
              </button>
            </motion.div>
          ) : (
            /* Processing state */
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass"
              style={{ padding: '2.5rem', textAlign: 'center' }}
            >
              <div style={{ marginBottom: '2rem' }}>
                {status === 'done' ? (
                  <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto' }} />
                ) : (
                  <Loader2 size={48} color="#1E7B45" style={{ margin: '0 auto', animation: 'spin 1s linear infinite' }} />
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {STATUS_STEPS.map((step, i) => {
                  const isDone = currentStepIndex > i || status === 'done';
                  const isCurrent = currentStepIndex === i;
                  return (
                    <div
                      key={step.key}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        background: isCurrent ? 'rgba(30,123,69,0.1)' : 'transparent',
                        border: isCurrent ? '1px solid rgba(30,123,69,0.25)' : '1px solid transparent',
                        opacity: i > currentStepIndex && status !== 'done' ? 0.3 : 1,
                        transition: 'all 0.3s',
                      }}
                    >
                      {isDone ? (
                        <CheckCircle size={18} color="#16A34A" />
                      ) : isCurrent ? (
                        <Loader2 size={18} color="#1E7B45" style={{ animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <step.icon size={18} color="#9CA3AF" />
                      )}
                      <span style={{ color: isCurrent ? '#0F172A' : isDone ? '#16A34A' : '#9CA3AF', fontSize: '0.9rem' }}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
}
