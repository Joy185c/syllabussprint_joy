'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { getWorkspaceId } from '@/lib/workspace';
import { KanbanBoardColumn } from '@/components/kanban/column';
import type { KanbanCard } from '@/types';
import { useColors } from '@/lib/useColors';
import { Loader2, Search, X, Filter } from 'lucide-react';
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

  // Filters State
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedFile, setSelectedFile] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('due_date_asc');

  // Load from local storage
  useEffect(() => {
    setWorkspaceId(getWorkspaceId());
    try {
      const saved = localStorage.getItem('kanbanFilters');
      if (saved) {
        const p = JSON.parse(saved);
        if (p.selectedFile) setSelectedFile(p.selectedFile);
        if (p.selectedCourse) setSelectedCourse(p.selectedCourse);
        if (p.statusFilter) setStatusFilter(p.statusFilter);
        if (p.priorityFilter) setPriorityFilter(p.priorityFilter);
        if (p.searchQuery) setSearchQuery(p.searchQuery);
        if (p.sortBy) setSortBy(p.sortBy);
      }
    } catch (e) {}
    setIsLoaded(true);
  }, []);

  // Save to local storage
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('kanbanFilters', JSON.stringify({
      selectedFile, selectedCourse, statusFilter, priorityFilter, searchQuery, sortBy
    }));
  }, [selectedFile, selectedCourse, statusFilter, priorityFilter, searchQuery, sortBy, isLoaded]);

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

  // Extract unique files and courses
  const { files, courses } = useMemo(() => {
    const fMap = new Map();
    const cMap = new Map();
    
    // Calculate counts alongside extraction to avoid multiple loops
    cards.forEach(c => {
      const filename = c.courses?.syllabus_files?.filename;
      if (filename) fMap.set(filename, (fMap.get(filename) || 0) + 1);
      
      const courseTitle = c.courses?.title ? `${c.courses.title} (${c.courses.course_code})` : null;
      if (courseTitle) cMap.set(c.course_id, { name: courseTitle, count: (cMap.get(c.course_id)?.count || 0) + 1 });
    });
    
    return {
      files: Array.from(fMap.entries()).map(([name, count]) => ({ name, count })),
      courses: Array.from(cMap.entries()).map(([id, info]) => ({ id, name: info.name, count: info.count }))
    };
  }, [cards]);

  // Client-side filtering & sorting
  const filteredCards = useMemo(() => {
    let result = cards;

    if (selectedFile !== 'all') {
      result = result.filter(c => c.courses?.syllabus_files?.filename === selectedFile);
    }
    if (selectedCourse !== 'all') {
      result = result.filter(c => c.course_id === selectedCourse);
    }
    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter);
    }
    if (priorityFilter !== 'all') {
      result = result.filter(c => c.priority === priorityFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.title.toLowerCase().includes(q) || 
        (c.description && c.description.toLowerCase().includes(q)) ||
        (c.courses?.title && c.courses.title.toLowerCase().includes(q)) ||
        (c.courses?.course_code && c.courses.course_code.toLowerCase().includes(q))
      );
    }

    result = [...result].sort((a, b) => {
      if (sortBy === 'due_date_asc') {
        const aTime = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const bTime = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        if (aTime !== bTime) return aTime - bTime;
      }
      if (sortBy === 'priority_desc') {
        const pMap = { high: 0, medium: 1, low: 2 };
        if (pMap[a.priority] !== pMap[b.priority]) return pMap[a.priority] - pMap[b.priority];
      }
      if (sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      // recent or fallback
      return a.position - b.position;
    });

    return result;
  }, [cards, selectedFile, selectedCourse, statusFilter, priorityFilter, searchQuery, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    let todo = 0, doing = 0, done = 0;
    filteredCards.forEach(c => {
      if (c.status === 'todo') todo++;
      else if (c.status === 'doing') doing++;
      else if (c.status === 'done') done++;
    });
    return { total: filteredCards.length, todo, doing, done };
  }, [filteredCards]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeCard = cards.find(c => c.id === activeId);
    if (!activeCard) return;

    const isOverColumn = COLUMNS.some(col => col.id === overId);
    let newStatus = activeCard.status;
    let newPosition = activeCard.position;

    if (isOverColumn) {
       newStatus = overId as KanbanCard['status'];
       const columnCards = cards.filter(c => c.status === newStatus); // Calculate based on master cards
       newPosition = columnCards.length;
    } else {
       const overCard = cards.find(c => c.id === overId);
       if (overCard) {
         newStatus = overCard.status;
         newPosition = overCard.position;
       }
    }

    if (activeCard.status !== newStatus || activeCard.position !== newPosition) {
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

  if (!isLoaded || isLoading) return (
    <div className="container" style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
      <Loader2 size={32} color="#1E7B45" style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  );

  const activeFiltersCount = (selectedFile !== 'all' ? 1 : 0) + (selectedCourse !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (priorityFilter !== 'all' ? 1 : 0);

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header & Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: colors.text, marginBottom: '0.25rem' }}>Kanban Board</h1>
          <p style={{ color: colors.textMuted, fontSize: '0.9rem' }}>Drag and drop tasks to track your progress</p>
        </div>
        
        {/* Quick Statistics */}
        <div style={{ display: 'flex', gap: '1rem', background: colors.surface, padding: '0.75rem 1rem', borderRadius: '12px', border: `1px solid ${colors.border}` }}>
          <div style={{ textAlign: 'center', padding: '0 0.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Total</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: colors.text }}>{stats.total}</div>
          </div>
          <div style={{ width: '1px', background: colors.border }} />
          <div style={{ textAlign: 'center', padding: '0 0.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>To Do</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F4C3A' }}>{stats.todo}</div>
          </div>
          <div style={{ width: '1px', background: colors.border }} />
          <div style={{ textAlign: 'center', padding: '0 0.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Doing</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F59E0B' }}>{stats.doing}</div>
          </div>
          <div style={{ width: '1px', background: colors.border }} />
          <div style={{ textAlign: 'center', padding: '0 0.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Done</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16A34A' }}>{stats.done}</div>
          </div>
        </div>
      </div>

      <div style={{ 
        position: 'sticky', top: 0, zIndex: 10, background: colors.surfaceDeep,
        paddingBottom: '1rem', marginBottom: '1rem', borderBottom: `1px solid ${colors.border}`
      }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={16} color={colors.textMuted} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search tasks, courses, notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '0.5rem 0.5rem 0.5rem 2.25rem',
                borderRadius: '8px', border: `1px solid ${colors.border}`,
                background: colors.surface, color: colors.text, fontSize: '0.875rem',
                outline: 'none'
              }}
            />
          </div>

          {/* File Filter */}
          <select value={selectedFile} onChange={e => setSelectedFile(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, fontSize: '0.875rem', outline: 'none' }}>
            <option value="all">All Files</option>
            {files.map(f => (
              <option key={f.name} value={f.name}>{f.name} ({f.count})</option>
            ))}
          </select>

          {/* Course Filter */}
          <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, fontSize: '0.875rem', outline: 'none' }}>
            <option value="all">All Courses</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.count})</option>
            ))}
          </select>

          {/* Status Filter */}
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, fontSize: '0.875rem', outline: 'none' }}>
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="doing">In Progress</option>
            <option value="done">Done</option>
          </select>

          {/* Priority Filter */}
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, fontSize: '0.875rem', outline: 'none' }}>
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Sort */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, fontSize: '0.875rem', outline: 'none' }}>
            <option value="due_date_asc">Due Date (Ascending)</option>
            <option value="priority_desc">Priority (High to Low)</option>
            <option value="recent">Recently Added</option>
            <option value="alphabetical">Alphabetical (A-Z)</option>
          </select>
        </div>

        {/* Filter Chips */}
        {activeFiltersCount > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem', alignItems: 'center' }}>
            <Filter size={14} color={colors.textMuted} />
            <span style={{ fontSize: '0.8rem', color: colors.textMuted, marginRight: '0.25rem' }}>Active Filters:</span>
            
            {selectedFile !== 'all' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', background: 'rgba(30,123,69,0.1)', color: '#1E7B45', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 600 }}>
                File: {selectedFile.length > 20 ? selectedFile.substring(0, 20) + '...' : selectedFile}
                <button onClick={() => setSelectedFile('all')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}><X size={12} color="#1E7B45" /></button>
              </div>
            )}
            
            {selectedCourse !== 'all' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', background: 'rgba(30,123,69,0.1)', color: '#1E7B45', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 600 }}>
                Course: {courses.find(c => c.id === selectedCourse)?.name || 'Unknown'}
                <button onClick={() => setSelectedCourse('all')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}><X size={12} color="#1E7B45" /></button>
              </div>
            )}
            
            {statusFilter !== 'all' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', background: 'rgba(30,123,69,0.1)', color: '#1E7B45', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 600 }}>
                Status: {statusFilter}
                <button onClick={() => setStatusFilter('all')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}><X size={12} color="#1E7B45" /></button>
              </div>
            )}
            
            {priorityFilter !== 'all' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', background: 'rgba(30,123,69,0.1)', color: '#1E7B45', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 600 }}>
                Priority: {priorityFilter}
                <button onClick={() => setPriorityFilter('all')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}><X size={12} color="#1E7B45" /></button>
              </div>
            )}

            <button 
              onClick={() => { setSelectedFile('all'); setSelectedCourse('all'); setStatusFilter('all'); setPriorityFilter('all'); setSearchQuery(''); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: colors.textMuted, textDecoration: 'underline', marginLeft: '0.25rem' }}
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {filteredCards.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ background: colors.surface, padding: '3rem', borderRadius: '24px', border: `1px dashed ${colors.border}`, maxWidth: '400px' }}>
            <Filter size={48} color={colors.textSubtle} style={{ marginBottom: '1.5rem', opacity: 0.5, display: 'inline-block' }} />
            <h3 style={{ color: colors.text, fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>No tasks match your current filters.</h3>
            <p style={{ color: colors.textMuted, fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Try changing the course, status, priority or search keyword.
            </p>
            <button 
              onClick={() => { setSelectedFile('all'); setSelectedCourse('all'); setStatusFilter('all'); setPriorityFilter('all'); setSearchQuery(''); }}
              className="btn-primary" style={{ margin: '0 auto', background: '#1E7B45' }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '1.5rem', flex: 1, overflowX: 'auto', paddingBottom: '1rem' }}>
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            {COLUMNS.map(col => {
               const columnCards = filteredCards.filter(c => c.status === col.id);
               return (
                 <KanbanBoardColumn
                   key={col.id}
                   id={col.id}
                   title={col.title}
                   color={col.color}
                   cards={columnCards}
                   onStatusChange={handleStatusChange}
                 />
               )
            })}
          </DndContext>
        </div>
      )}
    </div>
  );
}
