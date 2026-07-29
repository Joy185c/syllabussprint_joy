import { z } from 'zod';

// ── Assignment ────────────────────────────────────────────────────────────────
export const AssignmentSchema = z.object({
  title: z.string(),
  description: z.string().optional().default(''),
  deadline: z.string().optional().default(''),
  weight: z.number().optional().default(0),
  type: z.string().optional().default('assignment'),
});

// ── Exam ──────────────────────────────────────────────────────────────────────
export const ExamSchema = z.object({
  type: z.string(),   // midterm | final | quiz | lab
  date: z.string().optional().default(''),
  weight: z.number().optional().default(0),
  topics: z.array(z.string()).optional().default([]),
});

// ── Topic ─────────────────────────────────────────────────────────────────────
export const TopicSchema = z.object({
  week: z.number().optional().default(0),
  topic: z.string(),
  description: z.string().optional().default(''),
  learning_objectives: z.string().optional().default(''),
  covered_concepts: z.string().optional().default(''),
  key_keywords: z.string().optional().default(''),
  reading_materials: z.string().optional().default(''),
  reference_books: z.string().optional().default(''),
  class_activities: z.string().optional().default(''),
  lab_activities: z.string().optional().default(''),
  deliverables: z.string().optional().default(''),
  suggested_study_hours: z.string().optional().default(''),
  notes: z.string().optional().default(''),
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
  course_name: z.string(),
  course_code: z.string().optional().default(''),
  semester: z.string().optional().default(''),
  instructor: z.string().optional().default(''),
  credits: z.number().optional().default(0),
  description: z.string().optional().default(''),
  assignments: z.array(AssignmentSchema).default([]),
  exams: z.array(ExamSchema).default([]),
  topics: z.array(TopicSchema).default([]),
  weights: z.array(WeightSchema).default([]),
  submission_rules: z.string().optional().default(''),
  office_hours: z.string().optional().default(''),
});

export type ExtractedSyllabus = z.infer<typeof ExtractedSyllabusSchema>;
export type Assignment = z.infer<typeof AssignmentSchema>;
export type Exam = z.infer<typeof ExamSchema>;
export type Topic = z.infer<typeof TopicSchema>;
export type Weight = z.infer<typeof WeightSchema>;
