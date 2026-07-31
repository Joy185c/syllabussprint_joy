import { z } from 'zod';

// ── Assignment ────────────────────────────────────────────────────────────────
export const AssignmentSchema = z.object({
  title: z.coerce.string(),
  description: z.coerce.string().optional().default(''),
  deadline: z.coerce.string().optional().default(''),
  weight: z.number().optional().default(0),
  type: z.coerce.string().optional().default('assignment'),
});

// ── Exam ──────────────────────────────────────────────────────────────────────
export const ExamSchema = z.object({
  type: z.coerce.string(),   // midterm | final | quiz | lab
  date: z.coerce.string().optional().default(''),
  weight: z.number().optional().default(0),
  topics: z.array(z.coerce.string()).optional().default([]),
});

// ── Study Session (AI Generated) ──────────────────────────────────────────────
export const StudySessionSchema = z.object({
  title: z.coerce.string().optional().default('Study Session'),
  date: z.coerce.string().optional().default(''),
  description: z.coerce.string().optional().default(''),
  type: z.coerce.string().optional().default('study_session'),
});

// ── Topic ─────────────────────────────────────────────────────────────────────
export const TopicSchema = z.object({
  week: z.number().optional().default(0),
  topic: z.coerce.string(),
  description: z.coerce.string().optional().default(''),
  learning_objectives: z.coerce.string().optional().default(''),
  covered_concepts: z.coerce.string().optional().default(''),
  key_keywords: z.coerce.string().optional().default(''),
  reading_materials: z.coerce.string().optional().default(''),
  reference_books: z.coerce.string().optional().default(''),
  class_activities: z.coerce.string().optional().default(''),
  lab_activities: z.coerce.string().optional().default(''),
  deliverables: z.coerce.string().optional().default(''),
  suggested_study_hours: z.coerce.string().optional().default(''),
  notes: z.coerce.string().optional().default(''),
});

export const EnrichedTopicSchema = z.object({
  topic_id: z.string(),
  description_confidence: z.enum(['high', 'medium', 'low']).optional().default('low'),
  ai_summary: z.string().optional().default(''),
  ai_key_concepts: z.array(z.string()).optional().default([]),
  ai_learning_outcomes: z.array(z.string()).optional().default([]),
  ai_practice: z.array(z.string()).optional().default([]),
  ai_study_tips: z.array(z.string()).optional().default([]),
  ai_common_mistakes: z.array(z.string()).optional().default([]),
  estimated_study_time: z.string().optional().default(''),
  difficulty_level: z.string().optional().default(''),
});

export const EnrichmentResultSchema = z.object({
  enriched_topics: z.array(EnrichedTopicSchema)
});

// ── Grade Weight ──────────────────────────────────────────────────────────────
export const WeightSchema = z.object({
  category: z.string(),
  percentage: z.number(),
});

// ── Full Extracted Syllabus ───────────────────────────────────────────────────
export const ExtractedSyllabusSchema = z.object({
  course_name: z.coerce.string(),
  course_code: z.coerce.string().optional().default(''),
  semester: z.coerce.string().optional().default(''),
  instructor: z.coerce.string().optional().default(''),
  credits: z.number().optional().default(0),
  description: z.coerce.string().optional().default(''),
  assignments: z.array(AssignmentSchema).default([]),
  exams: z.array(ExamSchema).default([]),
  topics: z.array(TopicSchema).default([]),
  weights: z.array(WeightSchema).default([]),
  study_sessions: z.array(StudySessionSchema).optional().default([]),
  submission_rules: z.coerce.string().optional().default(''),
  office_hours: z.coerce.string().optional().default(''),
});

export type ExtractedSyllabus = z.infer<typeof ExtractedSyllabusSchema>;
export type Assignment = z.infer<typeof AssignmentSchema>;
export type Exam = z.infer<typeof ExamSchema>;
export type Topic = z.infer<typeof TopicSchema>;
export type Weight = z.infer<typeof WeightSchema>;
export type StudySession = z.infer<typeof StudySessionSchema>;
