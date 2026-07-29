import type { ExtractedSyllabus } from '@/lib/validation/syllabus';

export interface KanbanCard {
  title: string;
  description?: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  type: string;
}

function getPriority(dueDate?: string): 'low' | 'medium' | 'high' {
  if (!dueDate) return 'low';
  const due = new Date(dueDate);
  if (isNaN(due.getTime())) return 'low';
  const daysUntil = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysUntil <= 7) return 'high';
  if (daysUntil <= 21) return 'medium';
  return 'low';
}

// Generates initial Kanban board cards from extracted syllabus
export function generateKanbanCards(data: ExtractedSyllabus): KanbanCard[] {
  const cards: KanbanCard[] = [];

  // Assignment cards
  for (const a of data.assignments) {
    cards.push({
      title: a.title,
      description: a.description || a.type,
      status: 'todo',
      priority: getPriority(a.deadline),
      due_date: a.deadline || undefined,
      type: a.type || 'assignment',
    });
  }

  // Exam cards
  for (const e of data.exams) {
    cards.push({
      title: `${e.type.charAt(0).toUpperCase() + e.type.slice(1)} Exam`,
      description: e.topics?.join(', ') || '',
      status: 'todo',
      priority: getPriority(e.date),
      due_date: e.date || undefined,
      type: 'exam',
    });
  }

  // Sort: high priority first
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return cards.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}
