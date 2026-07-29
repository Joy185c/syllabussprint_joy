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
  reading: z.string().optional().default(''),
  notes: z.string().optional().default(''),
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
