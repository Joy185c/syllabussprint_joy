import type { ExtractedSyllabus } from '@/lib/validation/syllabus';

export interface TimelineItem {
  title: string;
  date: string;
  type: 'assignment' | 'exam' | 'task' | 'deadline' | 'study_session';
  description?: string;
}

// Generates a list of timeline events from extracted syllabus data
export function generateTimeline(data: ExtractedSyllabus): TimelineItem[] {
  const items: TimelineItem[] = [];

  // Add assignments
  for (const a of data.assignments) {
    if (a.deadline) {
      items.push({
        title: a.title,
        date: a.deadline,
        type: 'assignment',
        description: a.description,
      });
    }
  }

  // Add exams
  for (const e of data.exams) {
    if (e.date) {
      items.push({
        title: `${e.type.charAt(0).toUpperCase() + e.type.slice(1)} Exam`,
        date: e.date,
        type: 'exam',
        description: e.topics?.join(', '),
      });
    }
  }

  // Add AI-generated study sessions
  if (data.study_sessions) {
    for (const session of data.study_sessions) {
      if (session.date) {
        items.push({
          title: session.title,
          date: session.date,
          type: 'study_session',
          description: session.description,
        });
      }
    }
  }

  // Sort by date ascending
  return items
    .filter((i) => i.date && i.date.length >= 8)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
