import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { extractSyllabusData } from '@/lib/ai/extract';
import { generateTimeline } from '@/lib/planner/timeline';
import { generateKanbanCards } from '@/lib/planner/kanban';

export const runtime = 'nodejs';

function generateTopicHash(t: any): string {
  const content = `${t.topic}|${t.description}|${t.learning_objectives}|${t.covered_concepts}`;
  return crypto.createHash('sha256').update(content).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { syllabus_id, workspace_id } = await request.json();

    if (!syllabus_id || !workspace_id) {
      return Response.json({ error: 'syllabus_id and workspace_id are required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // 1. Load raw text from DB
    const { data: syllabusFile, error: fetchError } = await supabase
      .from('syllabus_files')
      .select('raw_text, filename')
      .eq('id', syllabus_id)
      .eq('workspace_id', workspace_id)
      .single();

    if (fetchError || !syllabusFile) {
      return Response.json({ error: 'Syllabus file not found' }, { status: 404 });
    }

    // Attempt to guess course subject (very naive)
    const courseSubject = syllabusFile.filename.split('.')[0] || 'General Education';

    // 2. AI extraction
    const extraction = await extractSyllabusData(syllabusFile.raw_text);
    if (!extraction.success || !extraction.data) {
      return Response.json({ error: extraction.error ?? 'AI extraction failed' }, { status: 422 });
    }

    const data = extraction.data;

    // 3. Save course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert({
        workspace_id,
        syllabus_id,
        title: data.course_name,
        course_code: data.course_code,
        semester: data.semester,
        instructor: data.instructor,
        credits: data.credits,
        description: data.description,
        course_subject: courseSubject // Store subject for AI context
      })
      .select('id')
      .single();

    if (courseError) {
      return Response.json({ error: `Course insert failed: ${courseError.message}` }, { status: 500 });
    }

    const courseId = course.id;

    // 4. Save topics
    if (data.topics.length > 0) {
      await supabase.from('topics').insert(
        data.topics.map((t) => ({
          course_id: courseId,
          week: t.week,
          topic: t.topic,
          description: t.description || '',
          learning_objectives: t.learning_objectives || '',
          covered_concepts: t.covered_concepts || '',
          key_keywords: t.key_keywords || '',
          reading_materials: t.reading_materials || '',
          reference_books: t.reference_books || '',
          class_activities: t.class_activities || '',
          lab_activities: t.lab_activities || '',
          deliverables: t.deliverables || '',
          suggested_study_hours: t.suggested_study_hours || '',
          notes: t.notes || '',
          topic_hash: generateTopicHash(t),
          ai_status: 'queued',
          ai_version: 'v1.0',
          prompt_version: 'topic-enrichment-v3',
          ai_quality_score: 0,
          ai_provider: 'Groq',
          ai_model: 'llama3-70b-8192'
        }))
      );
    }

    // 5. Save assignments
    if (data.assignments.length > 0) {
      await supabase.from('assignments').insert(
        data.assignments.map((a) => ({
          course_id: courseId,
          title: a.title,
          description: a.description,
          deadline: a.deadline || null,
          weight: a.weight,
          status: 'pending',
          priority: 'medium',
        }))
      );
    }

    // 6. Save exams
    if (data.exams.length > 0) {
      await supabase.from('exams').insert(
        data.exams.map((e) => ({
          course_id: courseId,
          type: e.type,
          date: e.date || null,
          weight: e.weight,
        }))
      );
    }

    // 7. Generate + save timeline
    const timelineItems = generateTimeline(data);
    if (timelineItems.length > 0) {
      await supabase.from('timeline').insert(
        timelineItems.map((t) => ({
          course_id: courseId,
          date: t.date,
          title: t.title,
          type: t.type,
          description: t.description ?? '',
        }))
      );
    }

    // 8. Generate + save Kanban cards
    const kanbanCards = generateKanbanCards(data);
    if (kanbanCards.length > 0) {
      await supabase.from('kanban_cards').insert(
        kanbanCards.map((c, i) => ({
          course_id: courseId,
          title: c.title,
          description: c.description ?? '',
          status: c.status,
          priority: c.priority,
          due_date: c.due_date ?? null,
          position: i,
        }))
      );
    }

    console.log(`[Upload API] Saved components for course ${course.id}`);

    const { triggerAnalyticsRefreshByWorkspace } = await import('@/lib/analytics');
    triggerAnalyticsRefreshByWorkspace(workspace_id);

    return Response.json({
      success: true,
      course_id: courseId,
      course_name: data.course_name,
      assignments_count: data.assignments.length,
      exams_count: data.exams.length,
      topics_count: data.topics.length,
      timeline_count: timelineItems.length,
      kanban_count: kanbanCards.length,
      start_background_enrichment: data.topics.length > 0,
    });
  } catch (err) {
    console.error('[Extract] Unexpected error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
