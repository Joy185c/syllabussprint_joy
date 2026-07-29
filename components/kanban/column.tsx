import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCardComponent } from './card';
import type { KanbanCard } from '@/types';

export function KanbanBoardColumn({ id, title, color, cards }: { id: string; title: string; color: string; cards: KanbanCard[] }) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="kanban-col">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h3 style={{ color: '#e0e7ff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
          {title}
        </h3>
        <span style={{ background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '100px', fontWeight: 600 }}>
          {cards.length}
        </span>
      </div>

      <div ref={setNodeRef} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '100px' }}>
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map(card => (
            <KanbanCardComponent key={card.id} card={card} />
          ))}
        </SortableContext>
        {cards.length === 0 && (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.85rem', border: '1px dashed rgba(99,102,241,0.2)', borderRadius: '12px' }}>
            Drop cards here
          </div>
        )}
      </div>
    </div>
  );
}
