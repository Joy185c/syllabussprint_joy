import Groq from 'groq-sdk';
import { AI_CONFIG } from '@/lib/config';

// Isolated Groq client — all AI traffic routes through here
let _client: Groq | null = null;

export function getAIClient(): Groq {
  if (_client) return _client;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set in environment variables');
  }

  _client = new Groq({
    apiKey,
    timeout: AI_CONFIG.timeoutMs,
    maxRetries: 0, // We handle retries manually for better error reporting
  });

  return _client;
}
