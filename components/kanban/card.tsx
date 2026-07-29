import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { KanbanCard } from '@/types';
import { Calendar, AlertCircle } from 'lucide-react';
import { useColors } from '@/lib/useColors';

export function KanbanCardComponent({ card }: { card: KanbanCard }) {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.75rem', fontSize: '0.75rem', color: daysUntil && daysUntil <= 3 ? '#DC2626' : colors.textSubtle }}>
           {daysUntil && daysUntil <= 3 ? <AlertCircle size={12} /> : <Calendar size={12} />}
           {new Date(card.due_date).toLocaleDateString()} 
           {daysUntil !== null && ` (${daysUntil === 0 ? 'Today' : daysUntil < 0 ? 'Overdue' : `${daysUntil}d left`})`}
        </div>
      )}
    </div>
  );
}
