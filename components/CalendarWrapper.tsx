'use client';

import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar, BookOpen, AlignLeft, Clock, Tag } from 'lucide-react';
import { Modal } from '@/components/ui/modal';

type EventInfo = {
  title: string;
  course?: string;
  type?: string;
  description?: string;
  date?: string;
  color: string;
};

export default function CalendarWrapper({ events }: { events: any[] }) {
  const [selectedEvent, setSelectedEvent] = useState<EventInfo | null>(null);

  const typeLabel: Record<string, string> = {
    assignment: 'Assignment',
    exam: 'Exam',
    task: 'Study Task',
    deadline: 'Deadline',
  };

  const formattedDate = selectedEvent?.date
    ? new Date(selectedEvent.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  /* ── Days left calculation ─────────────────────────── */
  const daysLeft = selectedEvent?.date
    ? Math.ceil((new Date(selectedEvent.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const urgencyBg =
    daysLeft === null
      ? undefined
      : daysLeft < 0
      ? 'rgba(220,38,38,0.08)'
      : daysLeft <= 3
      ? 'rgba(220,38,38,0.08)'
      : daysLeft <= 7
      ? 'rgba(245,158,11,0.08)'
      : 'rgba(22,163,74,0.08)';

  const urgencyColor =
    daysLeft === null
      ? undefined
      : daysLeft < 0
      ? '#DC2626'
      : daysLeft <= 3
      ? '#DC2626'
      : daysLeft <= 7
      ? '#D97706'
      : '#16A34A';

  const urgencyText =
    daysLeft === null
      ? null
      : daysLeft < 0
      ? `${Math.abs(daysLeft)} days overdue`
      : daysLeft === 0
      ? 'Due today!'
      : daysLeft === 1
      ? 'Due tomorrow'
      : `${daysLeft} days left`;

  return (
    <>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin] as any}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,listWeek',
        }}
        events={events}
        height="auto"
        eventClick={(info) => {
          setSelectedEvent({
            title: info.event.title,
            course: info.event.extendedProps.course,
            type: info.event.extendedProps.type,
            description: info.event.extendedProps.description,
            date: info.event.startStr,
            color: info.event.backgroundColor,
          });
        }}
      />

      {/* ── Event Detail Modal ──────────────────────────── */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        accentColor={selectedEvent?.color}
        showCloseButton={true}
        maxWidth="460px"
      >
        {selectedEvent && (
          <div>
            {/* Type badge + title */}
            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                background: `${selectedEvent.color}18`,
                color: selectedEvent.color,
                padding: '0.25rem 0.75rem',
                borderRadius: '100px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.75rem',
              }}>
                <Tag size={11} />
                {typeLabel[selectedEvent.type ?? ''] ?? selectedEvent.type ?? 'Event'}
              </span>
              <h2 style={{ fontWeight: 800, fontSize: '1.35rem', color: '#0F172A', lineHeight: 1.3, margin: 0 }}>
                {selectedEvent.title}
              </h2>
            </div>

            {/* Info rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.5rem' }}>
              {selectedEvent.course && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{
                    width: '32px', height: '32px', background: 'rgba(15,76,58,0.08)',
                    borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <BookOpen size={15} color="#0F4C3A" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.15rem' }}>Course</div>
                    <div style={{ color: '#0F172A', fontWeight: 500, fontSize: '0.9rem' }}>{selectedEvent.course}</div>
                  </div>
                </div>
              )}

              {formattedDate && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{
                    width: '32px', height: '32px', background: 'rgba(30,123,69,0.08)',
                    borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Calendar size={15} color="#1E7B45" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.15rem' }}>Date</div>
                    <div style={{ color: '#0F172A', fontWeight: 500, fontSize: '0.9rem' }}>{formattedDate}</div>
                  </div>
                </div>
              )}

              {urgencyText && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '32px', height: '32px', background: urgencyBg,
                    borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Clock size={15} color={urgencyColor} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.15rem' }}>Time Left</div>
                    <div style={{ color: urgencyColor, fontWeight: 600, fontSize: '0.9rem' }}>{urgencyText}</div>
                  </div>
                </div>
              )}

              {selectedEvent.description && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{
                    width: '32px', height: '32px', background: 'rgba(75,85,99,0.08)',
                    borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px',
                  }}>
                    <AlignLeft size={15} color="#6B7280" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.15rem' }}>Details</div>
                    <div style={{ color: '#4B5563', fontSize: '0.875rem', lineHeight: 1.6 }}>{selectedEvent.description}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={() => setSelectedEvent(null)}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '10px',
                background: '#F8FAFC', border: '1px solid #E5E7EB',
                color: '#374151', fontWeight: 500, cursor: 'pointer',
                fontSize: '0.95rem', transition: 'all 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F1F5F9')}
              onMouseLeave={e => (e.currentTarget.style.background = '#F8FAFC')}
            >
              Close
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}
