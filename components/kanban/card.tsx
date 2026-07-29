import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { KanbanCard } from '@/types';
import { Calendar, AlertCircle, Clock } from 'lucide-react';
import { useColors } from '@/lib/useColors';

export function KanbanCardComponent({ card, onStatusChange }: { card: KanbanCard; onStatusChange?: (id: string, newStatus: string) => void }) {
  const colors = useColors();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { type: 'Card', card } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const daysUntil = card.due_date 
    ? Math.ceil((new Date(card.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: colors.surfaceAlt,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        padding: '1rem',
        cursor: 'grab',
        boxShadow: isDragging ? (colors.isDark ? '0 12px 32px rgba(0,0,0,0.5)' : '0 12px 32px rgba(15,76,58,0.15)') : colors.card.boxShadow,
        position: 'relative',
        zIndex: isDragging ? 50 : 1,
      }}
      {...attributes}
      {...listeners}
      className="glass-hover"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <h4 style={{ color: colors.text, fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.3, margin: 0 }}>
          {card.title}
        </h4>
        <span className={`badge-${card.priority}`} style={{ flexShrink: 0 }}>
          {card.priority.charAt(0).toUpperCase() + card.priority.slice(1)}
        </span>
      </div>

      {card.description && (
         <p style={{ color: colors.textMuted, fontSize: '0.8rem', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
           {card.description}
         </p>
      )}

      {card.due_date && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem', marginBottom: onStatusChange ? '1rem' : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: daysUntil && daysUntil <= 3 ? '#DC2626' : colors.textSubtle }}>
            {daysUntil && daysUntil <= 3 ? <AlertCircle size={12} /> : <Calendar size={12} />}
            {new Date(card.due_date).toLocaleDateString()}
          </div>
          {daysUntil !== null && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              padding: '2px 8px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 600,
              background: daysUntil <= 3 ? 'rgba(220,38,38,0.1)' : daysUntil <= 7 ? 'rgba(245,158,11,0.1)' : 'rgba(30,123,69,0.1)',
              color: daysUntil <= 3 ? '#DC2626' : daysUntil <= 7 ? '#D97706' : '#1E7B45'
            }}>
              <Clock size={10} />
              {daysUntil === 0 ? 'Due Today' : daysUntil < 0 ? 'Overdue' : `${daysUntil} Days Left`}
            </div>
          )}
        </div>
      )}
      
      {!card.due_date && onStatusChange && <div style={{ height: '1rem' }} />}

      {onStatusChange && (
        <div
          style={{ display: 'flex', gap: '0.5rem', borderTop: `1px solid ${colors.border}`, paddingTop: '0.75rem', marginTop: card.due_date ? 0 : '0.5rem' }}
          onPointerDown={(e) => e.stopPropagation()} // Prevent dnd-kit from intercepting button clicks
        >
          {card.status === 'todo' && (
            <button
              onClick={() => onStatusChange(card.id, 'doing')}
              style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', fontWeight: 600, borderRadius: '6px', border: 'none', background: '#F59E0B', color: '#FFF', cursor: 'pointer', transition: 'opacity 0.2s' }}
              className="hover:opacity-90"
            >
              Start Progress
            </button>
          )}
          {card.status === 'doing' && (
            <>
              <button
                onClick={() => onStatusChange(card.id, 'todo')}
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, borderRadius: '6px', border: `1px solid ${colors.border}`, background: 'transparent', color: colors.textMuted, cursor: 'pointer', transition: 'background 0.2s' }}
                className="hover:bg-black/5 dark:hover:bg-white/5"
              >
                Undo
              </button>
              <button
                onClick={() => onStatusChange(card.id, 'done')}
                style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', fontWeight: 600, borderRadius: '6px', border: 'none', background: '#16A34A', color: '#FFF', cursor: 'pointer', transition: 'opacity 0.2s' }}
                className="hover:opacity-90"
              >
                Complete
              </button>
            </>
          )}
          {card.status === 'done' && (
            <button
              onClick={() => onStatusChange(card.id, 'doing')}
              style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', fontWeight: 600, borderRadius: '6px', border: `1px solid ${colors.border}`, background: 'transparent', color: colors.textMuted, cursor: 'pointer', transition: 'background 0.2s' }}
              className="hover:bg-black/5 dark:hover:bg-white/5"
            >
              Undo (Move to Progress)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
