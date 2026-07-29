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
      setError('Invalid file type or size. Please upload a PDF, Markdown, or TXT file under 20MB.');
      return;
    }
    if (accepted.length > 0) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/markdown': ['.md', '.markdown'], 'text/plain': ['.txt'] },
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
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#e0e7ff', marginBottom: '0.5rem' }}>
            Upload Your <span className="gradient-text">Syllabus</span>
          </h1>
          <p style={{ color: '#9ca3af' }}>PDF, Markdown, or TXT — our AI handles the rest</p>
        </motion.div>

        {/* Drop Zone */}
        <AnimatePresence mode="wait">
          {status === 'idle' || status === 'error' ? (
            <motion.div key="dropzone" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div
                {...getRootProps()}
                style={{
                  border: `2px dashed ${isDragActive ? '#6366f1' : 'rgba(99,102,241,0.3)'}`,
                  borderRadius: '20px',
                  padding: '3rem 2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: isDragActive ? 'rgba(99,102,241,0.08)' : 'rgba(30,27,46,0.5)',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <input {...getInputProps()} />
                <motion.div animate={{ scale: isDragActive ? 1.1 : 1 }}>
                  <div style={{
                    width: '64px', height: '64px',
                    background: 'linear-gradient(135deg, #4f46e5, #9333ea)',
                    borderRadius: '16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1rem',
                  }}>
                    <Upload size={28} color="#fff" />
                  </div>
                </motion.div>
                <p style={{ color: '#e0e7ff', fontWeight: 600, marginBottom: '0.5rem', fontSize: '1.05rem' }}>
                  {isDragActive ? 'Drop it here!' : 'Drag & drop your syllabus'}
                </p>
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>or click to browse files</p>
                <p style={{ color: '#4b5563', fontSize: '0.8rem', marginTop: '0.75rem' }}>PDF, MD, TXT · Max 20MB</p>
              </div>

              {/* Selected file */}
              {file && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.25rem', marginTop: '1rem' }}
                >
                  <File size={20} color="#818cf8" />
                  <span style={{ flex: 1, color: '#e0e7ff', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </span>
                  <span style={{ color: '#6b7280', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '2px' }}
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
                    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: '12px', padding: '1rem 1.25rem', marginTop: '1rem', color: '#fca5a5',
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
                  <Loader2 size={48} color="#818cf8" style={{ margin: '0 auto', animation: 'spin 1s linear infinite' }} />
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
                        background: isCurrent ? 'rgba(99,102,241,0.15)' : 'transparent',
                        border: isCurrent ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                        opacity: i > currentStepIndex && status !== 'done' ? 0.3 : 1,
                        transition: 'all 0.3s',
                      }}
                    >
                      {isDone ? (
                        <CheckCircle size={18} color="#10b981" />
                      ) : isCurrent ? (
                        <Loader2 size={18} color="#818cf8" style={{ animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <step.icon size={18} color="#6b7280" />
                      )}
                      <span style={{ color: isCurrent ? '#e0e7ff' : isDone ? '#6ee7b7' : '#6b7280', fontSize: '0.9rem' }}>
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
