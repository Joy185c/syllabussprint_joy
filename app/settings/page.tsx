'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getWorkspaceId, resetWorkspace } from '@/lib/workspace';
import { useTheme } from '@/lib/theme';
import { AlertTriangle, Download, Sun, Moon, Trash2, Calendar, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ConfirmModal } from '@/components/ui/modal';
import { AcademicPlannerPDF } from '@/components/pdf/AcademicPlannerPDF';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function SettingsPage() {
  const [workspaceId, setWorkspaceId] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [pdfData, setPdfData] = useState<any>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

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

  const handleExportData = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const res = await fetch(`/api/export?workspace_id=${workspaceId}`);
      if (!res.ok) throw new Error('Export failed. Please try again.');
      const data = await res.json();

      // Trigger file download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `syllabussprint-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`✅ Exported ${data.summary.total_courses} courses successfully!`);
    } catch (err: any) {
      toast.error(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleExportICS = async () => {
    try {
      const res = await fetch(`/api/export/ics?workspace_id=${workspaceId}`);
      if (!res.ok) throw new Error('ICS Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SyllabusSprint_Calendar.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Calendar exported successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Export failed');
    }
  };

  const handleExportPDF = async () => {
    if (exportingPdf) return;
    setExportingPdf(true);
    toast.loading('Generating beautiful planner...', { id: 'pdf-toast' });
    try {
      // First fetch the data
      const res = await fetch(`/api/export?workspace_id=${workspaceId}`);
      if (!res.ok) throw new Error('Failed to fetch data');
      const data = await res.json();
      setPdfData(data);

      // Give React a moment to render the hidden PDF component
      setTimeout(async () => {
        if (!pdfRef.current) return;
        try {
          const canvas = await html2canvas(pdfRef.current, { scale: 2, useCORS: true });
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'pt', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save('Academic_Planner.pdf');
          toast.success('Planner downloaded successfully!', { id: 'pdf-toast' });
        } catch (e: any) {
          toast.error('Failed to generate PDF', { id: 'pdf-toast' });
        } finally {
          setExportingPdf(false);
        }
      }, 500);
    } catch (err: any) {
      toast.error(err.message || 'Export failed', { id: 'pdf-toast' });
      setExportingPdf(false);
    }
  };

  // Dynamic colors based on theme
  const surface = isDark ? '#161B22' : '#FFFFFF';
  const surfaceAlt = isDark ? '#21262D' : '#F8FAFC';
  const border = isDark ? '#30363D' : '#E5E7EB';
  const textPrimary = isDark ? '#E6EDF3' : '#0F172A';
  const textSecondary = isDark ? '#8B949E' : '#6B7280';

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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: textPrimary, marginBottom: '0.25rem' }}>
            Settings
          </h1>
          <p style={{ color: textSecondary, fontSize: '0.9rem' }}>
            Manage your workspace and application preferences.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* ── Workspace Info ──────────────────────────────── */}
          <div className="glass" style={{ padding: '1.5rem' }}>
            <h3 style={{ color: textPrimary, fontWeight: 600, marginBottom: '1rem' }}>
              Workspace Details
            </h3>
            <p style={{ color: textSecondary, fontSize: '0.9rem', marginBottom: '1rem' }}>
              SyllabusSprint uses a unique workspace ID stored in your browser to keep your data private and accessible without needing an account.
            </p>
            <div style={{
              background: surfaceAlt, border: `1px solid ${border}`,
              padding: '0.75rem 1rem', borderRadius: '8px',
              fontFamily: 'monospace', color: '#1E7B45', fontSize: '0.85rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              wordBreak: 'break-all',
            }}>
              <span style={{ color: textSecondary }}>ID:</span>
              {workspaceId || 'Loading...'}
            </div>
          </div>

          {/* ── Theme Toggle ────────────────────────────────── */}
          <div className="glass" style={{ padding: '1.5rem' }}>
            <h3 style={{ color: textPrimary, fontWeight: 600, marginBottom: '1rem' }}>
              Preferences
            </h3>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              background: surfaceAlt, border: `1px solid ${border}`, borderRadius: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* Icon */}
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: isDark ? 'rgba(128,194,66,0.15)' : 'rgba(15,76,58,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {isDark
                    ? <Moon size={20} color="#80C242" />
                    : <Sun size={20} color="#0F4C3A" />
                  }
                </div>
                <div>
                  <div style={{ color: textPrimary, fontWeight: 600, marginBottom: '0.15rem' }}>
                    Theme Mode
                  </div>
                  <div style={{ color: textSecondary, fontSize: '0.8rem' }}>
                    Currently using <strong>{isDark ? 'Dark' : 'Light'}</strong> mode. Click to switch.
                  </div>
                </div>
              </div>

              {/* Toggle switch */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '100px',
                  border: `1.5px solid ${isDark ? '#80C242' : '#0F4C3A'}`,
                  background: isDark ? 'rgba(128,194,66,0.12)' : 'rgba(15,76,58,0.06)',
                  color: isDark ? '#80C242' : '#0F4C3A',
                  fontWeight: 600, fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {isDark
                  ? <><Sun size={15} /> Switch to Light</>
                  : <><Moon size={15} /> Switch to Dark</>
                }
              </button>
            </div>
          </div>

          {/* ── Data Management ─────────────────────────────── */}
          <div className="glass" style={{ padding: '1.5rem', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
            <h3 style={{
              color: '#DC2626', fontWeight: 600, marginBottom: '1.25rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <AlertTriangle size={18} /> Danger Zone
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Export PDF */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '1rem', flexWrap: 'wrap',
              }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ color: textPrimary, fontWeight: 500, marginBottom: '0.25rem' }}>
                    Download Academic Planner (PDF)
                  </div>
                  <div style={{ color: textSecondary, fontSize: '0.8rem' }}>
                    Generate a beautifully formatted Academic Planner for the entire semester.
                  </div>
                </div>
                <button
                  onClick={handleExportPDF}
                  disabled={exportingPdf}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.7rem 1.4rem',
                    background: exportingPdf ? '#F1F5F9' : '#0F4C3A',
                    border: `1.5px solid ${exportingPdf ? '#E5E7EB' : '#0F4C3A'}`,
                    color: exportingPdf ? '#9CA3AF' : '#FFFFFF',
                    borderRadius: '10px', fontWeight: 600,
                    cursor: exportingPdf ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem', transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => {
                    if (!exportingPdf) e.currentTarget.style.background = '#093B2B';
                  }}
                  onMouseLeave={e => {
                    if (!exportingPdf) e.currentTarget.style.background = '#0F4C3A';
                  }}
                >
                  {exportingPdf
                    ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
                    : <><FileText size={15} /> Download Planner</>
                  }
                </button>
              </div>


              <hr style={{ borderColor: isDark ? '#30363D' : '#E5E7EB', margin: '0' }} />

              {/* Clear */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '1rem', flexWrap: 'wrap',
              }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ color: '#DC2626', fontWeight: 500, marginBottom: '0.25rem' }}>
                    Clear Workspace
                  </div>
                  <div style={{ color: textSecondary, fontSize: '0.8rem' }}>
                    Delete your local workspace ID. You will lose access to current data.
                  </div>
                </div>
                <button
                  onClick={() => setShowClearConfirm(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    background: 'rgba(220,38,38,0.08)', color: '#DC2626',
                    border: '1.5px solid rgba(220,38,38,0.25)',
                    padding: '0.7rem 1.4rem', borderRadius: '10px',
                    cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
                    transition: 'all 0.2s', whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.15)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.08)')}
                >
                  <Trash2 size={15} /> Clear Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      
      {/* Hidden PDF renderer */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        {pdfData && <AcademicPlannerPDF ref={pdfRef} data={pdfData} />}
      </div>
    </>
  );
}
