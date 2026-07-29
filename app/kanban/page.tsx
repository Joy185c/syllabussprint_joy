'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { getWorkspaceId } from '@/lib/workspace';
import { KanbanBoardColumn } from '@/components/kanban/column';
import type { KanbanCard } from '@/types';
import { useColors } from '@/lib/useColors';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: '#0F4C3A' },
  { id: 'doing', title: 'In Progress', color: '#F59E0B' },
  { id: 'done', title: 'Done', color: '#16A34A' },
] as const;

export default function KanbanPage() {
  const [workspaceId, setWorkspaceId] = useState('');
  const queryClient = useQueryClient();
  const colors = useColors();

  useEffect(() => {
    setWorkspaceId(getWorkspaceId());
  }, []);

  const { data, isLoading } = useQuery<{ cards: KanbanCard[] }>({
    queryKey: ['kanban', workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/kanban?workspace_id=${workspaceId}`);
      if (!res.ok) throw new Error('Failed to fetch cards');
      return res.json();
    },
    enabled: !!workspaceId,
  });

  const updateCardStatus = useMutation({
    mutationFn: async ({ id, status, position }: { id: string; status: string; position: number }) => {
      const res = await fetch('/api/kanban', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, position }),
      });
      if (!res.ok) throw new Error('Failed to update card');
      return res.json();
    },
    onError: () => {
      toast.error('Failed to save changes');
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
    }
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const cards = data?.cards ?? [];

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeCard = cards.find(c => c.id === activeId);
    if (!activeCard) return;

    // Moving between columns or reordering in same column
    const isOverColumn = COLUMNS.some(col => col.id === overId);
    let newStatus = activeCard.status;
    let newPosition = activeCard.position;

    if (isOverColumn) {
       newStatus = overId as KanbanCard['status'];
       const columnCards = cards.filter(c => c.status === newStatus);
       newPosition = columnCards.length;
    } else {
       const overCard = cards.find(c => c.id === overId);
       if (overCard) {
         newStatus = overCard.status;
         newPosition = overCard.position;
       }
    }

    if (activeCard.status !== newStatus || activeCard.position !== newPosition) {
       // Optimistic UI update
       queryClient.setQueryData(['kanban', workspaceId], (oldData: any) => {
         if (!oldData) return oldData;
         const newCards = oldData.cards.map((c: KanbanCard) => {
           if (c.id === activeId) {
             return { ...c, status: newStatus, position: newPosition };
           }
           return c;
         });
         return { cards: newCards };
       });

       updateCardStatus.mutate({ id: activeId, status: newStatus, position: newPosition });
    }
  };

  const handleStatusChange = (activeId: string, newStatus: string) => {
    const activeCard = cards.find(c => c.id === activeId);
    if (!activeCard) return;

    const columnCards = cards.filter(c => c.status === newStatus);
    const newPosition = columnCards.length;

    queryClient.setQueryData(['kanban', workspaceId], (oldData: any) => {
      if (!oldData) return oldData;
      const newCards = oldData.cards.map((c: KanbanCard) => {
        if (c.id === activeId) {
          return { ...c, status: newStatus, position: newPosition };
        }
        return c;
      });
      return { cards: newCards };
    });

    updateCardStatus.mutate({ id: activeId, status: newStatus, position: newPosition });
  };

  if (isLoading) return (
    <div className="container" style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
      <Loader2 size={32} color="#1E7B45" style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  );

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: colors.text, marginBottom: '0.25rem' }}>Kanban Board</h1>
        <p style={{ color: colors.textMuted, fontSize: '0.9rem' }}>Drag and drop tasks to track your progress</p>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, overflowX: 'auto', paddingBottom: '1rem' }}>
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          {COLUMNS.map(col => (
             <KanbanBoardColumn
               key={col.id}
               id={col.id}
               title={col.title}
               color={col.color}
               cards={cards.filter(c => c.status === col.id).sort((a, b) => {
                 if (col.id === 'todo') {
                   // Priority: High > Medium > Low
                   const pMap = { high: 0, medium: 1, low: 2 };
                   if (pMap[a.priority] !== pMap[b.priority]) return pMap[a.priority] - pMap[b.priority];
                   // Type: Exams first (check title since type is not in DB schema)
                   const aIsExam = a.title.toLowerCase().includes('exam');
                   const bIsExam = b.title.toLowerCase().includes('exam');
                   if (aIsExam && !bIsExam) return -1;
                   if (!aIsExam && bIsExam) return 1;
                   // Date: Closer dates first
                   const aTime = a.due_date ? new Date(a.due_date).getTime() : Infinity;
                   const bTime = b.due_date ? new Date(b.due_date).getTime() : Infinity;
                   if (aTime !== bTime) return aTime - bTime;
                 }
                 // Default to manual position sort
                 return a.position - b.position;
               })}
               onStatusChange={handleStatusChange}
             />
          ))}
        </DndContext>
      </div>
    </div>
  );
}
