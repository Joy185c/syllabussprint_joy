import type { ExtractedSyllabus } from '@/lib/validation/syllabus';

export interface TimelineItem {
  title: string;
  date: string;
  type: 'assignment' | 'exam' | 'task' | 'deadline';
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

      // Generate prep tasks leading up to deadline
      const deadlineDate = new Date(a.deadline);
      if (!isNaN(deadlineDate.getTime())) {
        const draftDate = new Date(deadlineDate);
        draftDate.setDate(draftDate.getDate() - 3);
        items.push({
          title: `Draft: ${a.title}`,
          date: draftDate.toISOString().split('T')[0],
          type: 'task',
          description: `Start drafting ${a.title}`,
        });

        const reviewDate = new Date(deadlineDate);
        reviewDate.setDate(reviewDate.getDate() - 1);
        items.push({
          title: `Review: ${a.title}`,
          date: reviewDate.toISOString().split('T')[0],
          type: 'task',
          description: `Final review before submission`,
        });
      }
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

      // Add study prep task 5 days before exam
      const examDate = new Date(e.date);
      if (!isNaN(examDate.getTime())) {
        const studyDate = new Date(examDate);
        studyDate.setDate(studyDate.getDate() - 5);
        items.push({
          title: `Study: ${e.type} prep`,
          date: studyDate.toISOString().split('T')[0],
          type: 'task',
          description: `Begin studying for ${e.type}`,
        });
      }
    }
  }

  // Sort by date ascending
  return items
    .filter((i) => i.date && i.date.length >= 8)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
