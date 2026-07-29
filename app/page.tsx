'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Upload, Clock, Kanban, Calendar, BarChart3,
  FileText, Brain, CheckCircle, ArrowRight, Zap, Sparkles
} from 'lucide-react';

const features = [
  { icon: FileText, title: 'PDF Extraction', desc: 'Reads any syllabus PDF or Markdown', color: '#818cf8' },
  { icon: Brain, title: 'AI Parsing', desc: 'GPT extracts every deadline & topic', color: '#c084fc' },
  { icon: Clock, title: 'Study Timeline', desc: 'Auto-scheduled preparation tasks', color: '#34d399' },
  { icon: Kanban, title: 'Kanban Board', desc: 'Drag-and-drop task management', color: '#60a5fa' },
  { icon: BarChart3, title: 'Analytics', desc: 'Track progress & completion rates', color: '#f59e0b' },
  { icon: Calendar, title: 'Calendar View', desc: 'All deadlines on one calendar', color: '#f472b6' },
];

const steps = [
  { label: 'Upload', icon: Upload, desc: 'Drop your PDF' },
  { label: 'AI Reads', icon: Brain, desc: 'GPT extracts data' },
  { label: 'Organize', icon: Kanban, desc: 'Kanban & timeline' },
  { label: 'Study', icon: CheckCircle, desc: 'Track progress' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Ambient orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section style={{ padding: '5rem 0 4rem', position: 'relative', zIndex: 1 }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: '100px', padding: '0.35rem 1rem', marginBottom: '1.5rem',
              fontSize: '0.85rem', color: '#a5b4fc',
            }}>
              <Sparkles size={14} />
              AI-Powered Academic Planner
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <img src="/logo.png" alt="SyllabusSprint Logo" style={{ height: '180px', width: 'auto', objectFit: 'contain' }} />
            </div>

            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, lineHeight: 1.2, marginBottom: '1.5rem', color: '#e0e7ff' }}>
              Your AI Study Companion
            </h1>

            <p style={{ fontSize: '1.15rem', color: '#9ca3af', maxWidth: '600px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
              Upload your university syllabus and instantly generate a visual Kanban board,
              study timeline, assignment tracker, and exam schedule — all powered by AI.
            </p>

            {/* Feature pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginBottom: '2.5rem' }}>
              {['✓ Timeline', '✓ Kanban Board', '✓ Study Plan', '✓ Deadlines', '✓ Analytics'].map((f) => (
                <span key={f} style={{
                  background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '100px', padding: '0.35rem 1rem',
                  fontSize: '0.85rem', color: '#a5b4fc',
                }}>{f}</span>
              ))}
            </div>

            <Link href="/upload" className="btn-primary" style={{ fontSize: '1.05rem', padding: '0.9rem 2.5rem' }}>
              <Upload size={18} />
              Upload Syllabus — It&apos;s Free
              <ArrowRight size={16} />
            </Link>
            <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#6b7280' }}>No signup required · Works instantly</p>
          </motion.div>
        </div>
      </section>

      {/* ── Workflow Steps ────────────────────────────────── */}
      <section style={{ padding: '3rem 0', position: 'relative', zIndex: 1 }}>
        <div className="container">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '0', flexWrap: 'wrap',
            }}
          >
            {steps.map((step, i) => (
              <motion.div key={step.label} variants={itemVariants} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                  padding: '1.25rem 1.5rem',
                  background: 'rgba(99,102,241,0.08)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '16px',
                  minWidth: '120px',
                  transition: 'all 0.2s',
                }}>
                  <div style={{
                    width: '44px', height: '44px',
                    background: `linear-gradient(135deg, #4f46e5, #9333ea)`,
                    borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <step.icon size={20} color="#fff" />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e0e7ff' }}>{step.label}</span>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'center' }}>{step.desc}</span>
                </div>
                {i < steps.length - 1 && (
                  <ArrowRight size={20} color="rgba(99,102,241,0.4)" style={{ margin: '0 0.5rem' }} />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features Grid ────────────────────────────────── */}
      <section style={{ padding: '4rem 0', position: 'relative', zIndex: 1 }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: '3rem' }}
          >
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#e0e7ff', marginBottom: '0.75rem' }}>
              Everything you need to <span className="gradient-text">ace your semester</span>
            </h2>
            <p style={{ color: '#9ca3af', fontSize: '1rem' }}>Upload once, organized forever</p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {features.map((f) => (
              <motion.div key={f.title} variants={itemVariants} className="glass glass-hover" style={{ padding: '1.75rem' }}>
                <div style={{
                  width: '48px', height: '48px',
                  background: `${f.color}18`,
                  border: `1px solid ${f.color}40`,
                  borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '1rem',
                }}>
                  <f.icon size={22} color={f.color} />
                </div>
                <h3 style={{ fontWeight: 700, color: '#e0e7ff', marginBottom: '0.4rem' }}>{f.title}</h3>
                <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: 1.6 }}>{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section style={{ padding: '5rem 0', position: 'relative', zIndex: 1 }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <motion.div
            className="glass"
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            style={{ padding: '3rem 2rem', maxWidth: '600px', margin: '0 auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <img src="/logo.png" alt="SyllabusSprint Logo" style={{ height: '80px', width: 'auto', objectFit: 'contain' }} />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#e0e7ff', marginBottom: '1rem' }}>
              Ready to sprint through your semester?
            </h2>
            <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>
              Upload your syllabus and get a complete academic plan in under 60 seconds.
            </p>
            <Link href="/upload" className="btn-primary">
              <Upload size={16} />
              Get Started Now
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
