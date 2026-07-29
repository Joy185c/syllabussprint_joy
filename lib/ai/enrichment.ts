import { getAIClient } from '@/lib/ai/client';
import { AI_CONFIG } from '@/lib/config';
import { TOPIC_ENRICHMENT_PROMPT } from '@/lib/prompts/enrichment';
import { EnrichmentResultSchema } from '@/lib/validation/syllabus';

export function computeQualityScore(topic: any): number {
  let score = 0;
  if (topic.ai_summary && topic.ai_summary.length > 20) score += 20;
  if (Array.isArray(topic.ai_key_concepts) && topic.ai_key_concepts.length >= 2) score += 20;
  if (Array.isArray(topic.ai_learning_outcomes) && topic.ai_learning_outcomes.length >= 2) score += 15;
  if (Array.isArray(topic.ai_practice) && topic.ai_practice.length >= 2) score += 15;
  if (Array.isArray(topic.ai_study_tips) && topic.ai_study_tips.length >= 2) score += 15;
  if (Array.isArray(topic.ai_common_mistakes) && topic.ai_common_mistakes.length >= 2) score += 15;
  return Math.min(100, score);
}

async function fetchWithRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === retries - 1) throw e;
      const delay = i === 0 ? 2000 : 5000;
      console.warn(`[Enrichment] Attempt ${i + 1} failed, retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Unreachable');
}

export async function enrichTopicsBatch(topics: any[], courseSubject: string = '') {
  if (topics.length === 0) return [];
  
  const client = getAIClient();
  
  const topicsJson = topics.map(t => ({
    topic_id: t.id,
    topic: t.topic,
    description: t.description,
    learning_objectives: t.learning_objectives,
    covered_concepts: t.covered_concepts,
  }));

  const userPrompt = `Course Subject: ${courseSubject || 'General'}\n\nTopics to enrich:\n${JSON.stringify(topicsJson, null, 2)}`;

  return fetchWithRetry(async () => {
    const response = await client.chat.completions.create({
      model: AI_CONFIG.model,
      messages: [
        { role: 'system', content: TOPIC_ENRICHMENT_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2, // Slightly higher than extraction for creative tips
    });

    const rawContent = response.choices[0]?.message?.content ?? '';
    
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      throw new Error('Invalid JSON returned by AI');
    }

    const validated = EnrichmentResultSchema.safeParse(parsed);
    if (!validated.success) {
      console.warn('[Enrichment] Validation failed:', validated.error.flatten());
      throw new Error('AI response did not match schema');
    }

    return validated.data.enriched_topics.map(t => {
      const score = computeQualityScore(t);
      return {
        ...t,
        ai_quality_score: score,
        ai_provider: 'Groq',
        ai_model: AI_CONFIG.model,
        ai_generated_on: new Date().toISOString(),
        ai_version: 'v1.0',
        prompt_version: 'topic-enrichment-v3',
        ai_status: 'completed' as const
      };
    });
  });
}
