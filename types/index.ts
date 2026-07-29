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
  ai_exam_readiness?: number | null;
  ai_exam_readiness_explanation?: string;
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
  description: string;
  learning_objectives: string;
  covered_concepts: string;
  key_keywords: string;
  reading_materials: string;
  reference_books: string;
  class_activities: string;
  lab_activities: string;
  deliverables: string;
  suggested_study_hours: string;
  notes: string;
  edited_by_user?: boolean;
  updated_at?: string;
  ai_summary?: string;
  ai_key_concepts?: string[];
  ai_learning_outcomes?: string[];
  ai_practice?: string[];
  ai_study_tips?: string[];
  ai_common_mistakes?: string[];
  estimated_study_time?: string;
  difficulty_level?: string;
  ai_status?: 'idle' | 'queued' | 'generating' | 'completed' | 'failed';
  ai_version?: string;
  prompt_version?: string;
  topic_hash?: string;
  ai_quality_score?: number;
  ai_provider?: string;
  ai_model?: string;
  ai_generated_on?: string;
  created_at?: string;
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
  notes?: string;
  edited_by_user?: boolean;
  updated_at?: string;
  source?: 'AI' | 'Manual';
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
  kanban_card_id?: string;
}

export interface SyllabusFile {
  id: string;
  workspace_id: string;
  filename: string;
  storage_url: string;
  raw_text: string;
  uploaded_at: string;
}

export interface WorkspaceAnalytics {
  workspace_id: string;
  ai_insights: {
    recommendations: string[];
    insights: string[];
  };
  analytics_hash: string;
  is_generating: boolean;
  updated_at: string;
}

export type UploadStatus =
  | 'idle'
  | 'uploading'
  | 'extracting'
  | 'saving'
  | 'done'
  | 'error';
