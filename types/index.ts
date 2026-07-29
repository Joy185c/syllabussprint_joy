// All shared TypeScript types across the app

export interface Course {
  id: string;
  workspace_id: string;
  syllabus_id: string;
  title: string;
  course_code: string;
  semester: string;
  instructor: string;
  credits: number;
  description: string;
  created_at: string;
  assignments?: Assignment[];
  exams?: Exam[];
  topics?: Topic[];
  timeline?: TimelineItem[];
  kanban_cards?: KanbanCard[];
}

export interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description: string;
  deadline: string | null;
  weight: number;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
}

export interface Exam {
  id: string;
  course_id: string;
  type: string;
  date: string | null;
  weight: number;
}

export interface Topic {
  id: string;
  course_id: string;
  week: number;
  topic: string;
  reading: string;
  notes: string;
}

export interface KanbanCard {
  id: string;
  course_id: string;
  title: string;
  description: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  position: number;
  type?: string;
  courses?: {
    title: string;
    course_code: string;
    syllabus_files?: {
      filename: string;
    };
  };
}

export interface TimelineItem {
  id: string;
  course_id: string;
  date: string;
  title: string;
  type: 'assignment' | 'exam' | 'task' | 'deadline';
  description: string;
}

export interface SyllabusFile {
  id: string;
  workspace_id: string;
  filename: string;
  storage_url: string;
  raw_text: string;
  uploaded_at: string;
}

export type UploadStatus =
  | 'idle'
  | 'uploading'
  | 'extracting'
  | 'saving'
  | 'done'
  | 'error';
