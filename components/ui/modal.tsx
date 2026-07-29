'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  /** accent colour strip at top */
  accentColor?: string;
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '480px',
  accentColor,
  showCloseButton = true,
}: ModalProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth,
              background: '#FFFFFF',
              borderRadius: '20px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 24px 64px rgba(15, 76, 58, 0.12), 0 4px 16px rgba(0,0,0,0.06)',
              overflow: 'hidden',
            }}
          >
            {/* Accent top line */}
            {accentColor && (
              <div style={{ height: '4px', background: accentColor, width: '100%' }} />
            )}

            {/* Header */}
            {(title || showCloseButton) && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: accentColor ? '1.25rem 1.5rem 0' : '1.5rem 1.5rem 0',
              }}>
                {title && (
                  <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0F172A', margin: 0 }}>
                    {title}
                  </h3>
                )}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    style={{
                      marginLeft: 'auto',
                      background: '#F8FAFC',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      width: '32px', height: '32px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#6B7280',
                      transition: 'all 0.15s',
                      flexShrink: 0,
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = '#FEE2E2';
                      (e.currentTarget as HTMLElement).style.borderColor = '#FECACA';
                      (e.currentTarget as HTMLElement).style.color = '#DC2626';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = '#F8FAFC';
                      (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB';
                      (e.currentTarget as HTMLElement).style.color = '#6B7280';
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div style={{ padding: '1.25rem 1.5rem 1.5rem' }}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** ConfirmModal — replaces native browser confirm() */
interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  icon?: React.ReactNode;
}

export function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  icon,
}: ConfirmModalProps) {
  const variantStyles = {
    danger:  { btn: { background: '#DC2626', color: '#fff', border: '1px solid #DC2626' }, accent: 'linear-gradient(90deg, #DC2626, #EF4444)' },
    warning: { btn: { background: '#D97706', color: '#fff', border: '1px solid #D97706' }, accent: 'linear-gradient(90deg, #D97706, #F59E0B)' },
    primary: { btn: { background: '#0F4C3A', color: '#fff', border: '1px solid #0F4C3A' }, accent: 'linear-gradient(90deg, #0F4C3A, #1E7B45)' },
  }[variant];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      accentColor={variantStyles.accent}
      showCloseButton={false}
      maxWidth="420px"
    >
      <div style={{ textAlign: 'center' }}>
        {icon && (
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: variant === 'danger' ? 'rgba(220,38,38,0.1)' : variant === 'warning' ? 'rgba(217,119,6,0.1)' : 'rgba(15,76,58,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}>
            {icon}
          </div>
        )}
        <h3 style={{ fontWeight: 700, fontSize: '1.25rem', color: '#0F172A', marginBottom: '0.75rem' }}>{title}</h3>
        <p style={{ color: '#4B5563', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>{message}</p>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '0.75rem', borderRadius: '10px',
              background: '#F8FAFC', border: '1px solid #E5E7EB', color: '#374151',
              fontWeight: 500, cursor: 'pointer', fontSize: '0.95rem',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#F1F5F9')}
            onMouseLeave={e => (e.currentTarget.style.background = '#F8FAFC')}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '0.75rem', borderRadius: '10px',
              fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem',
              transition: 'all 0.15s',
              ...variantStyles.btn,
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
