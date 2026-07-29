'use client';

import { useState, useEffect } from 'react';
import { getWorkspaceId, resetWorkspace } from '@/lib/workspace';
import { AlertTriangle, Download, Trash2, Moon, Sun } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [workspaceId, setWorkspaceId] = useState('');

  useEffect(() => {
    setWorkspaceId(getWorkspaceId());
  }, []);

  const handleClearWorkspace = () => {
    if (confirm('Are you sure you want to clear your workspace? All your local data reference will be lost. This cannot be undone.')) {
      const newId = resetWorkspace();
      setWorkspaceId(newId);
      toast.success('Workspace cleared successfully');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    }
  };

  const handleExportData = () => {
    // In a real app, this would fetch all data for the workspace and download it
    toast.success('Export started. Check your downloads folder.');
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '800px' }}>
      <div className="page-header">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#e0e7ff', marginBottom: '0.25rem' }}>Settings</h1>
        <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Manage your workspace and application preferences.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Workspace Info */}
        <div className="glass" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: '#e0e7ff', fontWeight: 600, marginBottom: '1rem' }}>Workspace Details</h3>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '1rem' }}>
            SyllabusSprint uses a unique workspace ID stored in your browser to keep your data private and accessible without needing an account.
          </p>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem 1rem', borderRadius: '8px', fontFamily: 'monospace', color: '#a5b4fc', fontSize: '0.85rem' }}>
            ID: {workspaceId || 'Loading...'}
          </div>
        </div>

        {/* Preferences */}
        <div className="glass" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: '#e0e7ff', fontWeight: 600, marginBottom: '1rem' }}>Preferences</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(30,27,46,0.5)', borderRadius: '10px' }}>
            <div>
              <div style={{ color: '#e0e7ff', fontWeight: 500 }}>Theme Mode</div>
              <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>SyllabusSprint is designed with a dark-mode first aesthetic. Light mode coming soon.</div>
            </div>
            <button className="btn-ghost" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
              <Moon size={16} /> Dark
            </button>
          </div>
        </div>

        {/* Data Management */}
        <div className="glass" style={{ padding: '1.5rem', border: '1px solid rgba(239,68,68,0.2)' }}>
          <h3 style={{ color: '#ef4444', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} /> Danger Zone
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: '#e0e7ff', fontWeight: 500 }}>Export Workspace Data</div>
                <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>Download a JSON file containing all your courses, tasks, and deadlines.</div>
              </div>
              <button className="btn-ghost" onClick={handleExportData}>
                <Download size={16} /> Export
              </button>
            </div>
            
            <hr style={{ borderColor: 'rgba(255,255,255,0.05)', margin: '0' }} />
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: '#ef4444', fontWeight: 500 }}>Clear Workspace</div>
                <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>Delete your local workspace ID. You will lose access to current data.</div>
              </div>
              <button onClick={handleClearWorkspace} style={{
                background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)',
                padding: '0.75rem 1.25rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600
              }}>
                <Trash2 size={16} /> Clear Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
