import { getAIClient } from '@/lib/ai/client';
import { AI_CONFIG } from '@/lib/config';
import { SYLLABUS_EXTRACTION_PROMPT } from '@/lib/prompts/syllabus';
import { ExtractedSyllabusSchema, type ExtractedSyllabus } from '@/lib/validation/syllabus';

export type ExtractionResult = {
  success: true;
  data: ExtractedSyllabus;
} | {
  success: false;
  error: string;
};

export async function extractSyllabusData(
  text: string
): Promise<{ success: boolean; data?: ExtractedSyllabus; error?: string }> {
  const client = getAIClient();
  const maxRetries = AI_CONFIG.maxRetries;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: AI_CONFIG.model,
        messages: [
          { role: 'system', content: SYLLABUS_EXTRACTION_PROMPT },
          {
            role: 'user',
            content: `Extract structured data from this syllabus:\n\n${text.slice(0, 12000)}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });

      const rawContent = response.choices[0]?.message?.content ?? '';

      // Parse JSON
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawContent);
      } catch {
        console.warn(`[AI] Attempt ${attempt}: Invalid JSON from AI, retrying...`);
        if (attempt === maxRetries) {
          return { success: false, error: 'AI returned invalid JSON after all retries' };
        }
        continue;
      }

      // Zod validate
      const validated = ExtractedSyllabusSchema.safeParse(parsed);
      if (!validated.success) {
        console.warn(`[AI] Attempt ${attempt}: Validation failed:`, validated.error.flatten());
        if (attempt === maxRetries) {
          return {
            success: false,
            error: `Validation failed: ${validated.error.flatten().fieldErrors}`,
          };
        }
        continue;
      }

      return { success: true, data: validated.data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown AI error';
      console.error(`[AI] Attempt ${attempt} error:`, message);

      // Don't retry on API key / auth errors
      if (message.includes('401') || message.includes('403')) {
        return { success: false, error: `AI authentication failed: ${message}` };
      }

      if (attempt === maxRetries) {
        return { success: false, error: `AI service error after ${maxRetries} attempts: ${message}` };
      }

      // Exponential backoff
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }

  return { success: false, error: 'Extraction failed' };
}
