'use client';

import { useState, useEffect } from 'react';
import { getWorkspaceId, resetWorkspace } from '@/lib/workspace';
import { AlertTriangle, Download, Sun, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ConfirmModal } from '@/components/ui/modal';

export default function SettingsPage() {
  const [workspaceId, setWorkspaceId] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    setWorkspaceId(getWorkspaceId());
  }, []);

  const handleClearWorkspace = () => {
    const newId = resetWorkspace();
    setWorkspaceId(newId);
    setShowClearConfirm(false);
    toast.success('Workspace cleared successfully');
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  };

  const handleExportData = () => {
    toast.success('Export started. Check your downloads folder.');
  };

  return (
    <>
      {/* ── Confirm Delete Modal ───────────────────────────── */}
      <ConfirmModal
        isOpen={showClearConfirm}
        onCancel={() => setShowClearConfirm(false)}
        onConfirm={handleClearWorkspace}
        variant="danger"
        icon={<Trash2 size={24} color="#DC2626" />}
        title="Clear Workspace?"
        message="This will permanently delete your local workspace ID. You will lose access to all current courses, tasks, and deadlines. This action cannot be undone."
        confirmLabel="Yes, Clear Data"
        cancelLabel="Keep My Data"
      />

      <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '800px' }}>
        <div className="page-header">
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.25rem' }}>Settings</h1>
          <p style={{ color: '#4B5563', fontSize: '0.9rem' }}>Manage your workspace and application preferences.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Workspace Info */}
          <div className="glass" style={{ padding: '1.5rem' }}>
            <h3 style={{ color: '#0F172A', fontWeight: 600, marginBottom: '1rem' }}>Workspace Details</h3>
            <p style={{ color: '#4B5563', fontSize: '0.9rem', marginBottom: '1rem' }}>
              SyllabusSprint uses a unique workspace ID stored in your browser to keep your data private and accessible without needing an account.
            </p>
            <div style={{
              background: '#F1F5F9', border: '1px solid #E5E7EB',
              padding: '0.75rem 1rem', borderRadius: '8px',
              fontFamily: 'monospace', color: '#1E7B45', fontSize: '0.85rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <span style={{ color: '#9CA3AF' }}>ID:</span>
              {workspaceId || 'Loading...'}
            </div>
          </div>

          {/* Preferences */}
          <div className="glass" style={{ padding: '1.5rem' }}>
            <h3 style={{ color: '#0F172A', fontWeight: 600, marginBottom: '1rem' }}>Preferences</h3>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1rem', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '10px',
            }}>
              <div>
                <div style={{ color: '#0F172A', fontWeight: 500 }}>Theme Mode</div>
                <div style={{ color: '#6B7280', fontSize: '0.8rem' }}>SyllabusSprint is designed with a premium light-mode aesthetic.</div>
              </div>
              <button className="btn-ghost" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                <Sun size={16} /> Light
              </button>
            </div>
          </div>

          {/* Data Management */}
          <div className="glass" style={{ padding: '1.5rem', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
            <h3 style={{
              color: '#DC2626', fontWeight: 600, marginBottom: '1rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <AlertTriangle size={18} /> Danger Zone
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ color: '#0F172A', fontWeight: 500 }}>Export Workspace Data</div>
                  <div style={{ color: '#6B7280', fontSize: '0.8rem' }}>Download a JSON file containing all your courses, tasks, and deadlines.</div>
                </div>
                <button className="btn-ghost" onClick={handleExportData}>
                  <Download size={16} /> Export
                </button>
              </div>

              <hr style={{ borderColor: '#E5E7EB', margin: '0' }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ color: '#DC2626', fontWeight: 500 }}>Clear Workspace</div>
                  <div style={{ color: '#6B7280', fontSize: '0.8rem' }}>Delete your local workspace ID. You will lose access to current data.</div>
                </div>
                <button
                  onClick={() => setShowClearConfirm(true)}
                  style={{
                    background: 'rgba(220, 38, 38, 0.1)', color: '#DC2626',
                    border: '1px solid rgba(220, 38, 38, 0.2)',
                    padding: '0.75rem 1.25rem', borderRadius: '10px',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    cursor: 'pointer', fontWeight: 600, transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.18)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.1)')}
                >
                  <Trash2 size={16} /> Clear Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
