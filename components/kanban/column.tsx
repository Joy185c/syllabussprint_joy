import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCardComponent } from './card';
import type { KanbanCard } from '@/types';
import { useColors } from '@/lib/useColors';

export function KanbanBoardColumn({ id, title, color, cards, onStatusChange }: { id: string; title: string; color: string; cards: KanbanCard[]; onStatusChange?: (id: string, newStatus: string) => void }) {
  const colors = useColors();
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="kanban-col">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h3 style={{ color: colors.text, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
          {title}
        </h3>
        <span style={{ background: 'rgba(30,123,69,0.1)', color: '#1E7B45', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '100px', fontWeight: 600 }}>
          {cards.length}
        </span>
      </div>

      <div ref={setNodeRef} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '100px', flex: 1, overflowY: 'auto', paddingRight: '0.5rem', marginRight: '-0.5rem' }}>
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map(card => (
            <KanbanCardComponent key={card.id} card={card} onStatusChange={onStatusChange} />
          ))}
        </SortableContext>
        {cards.length === 0 && (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: colors.textSubtle, fontSize: '0.85rem', border: `1px dashed ${colors.border}`, borderRadius: '12px' }}>
            Drop cards here
          </div>
        )}
      </div>
    </div>
  );
}
