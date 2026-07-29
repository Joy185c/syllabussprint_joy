// AI Provider Configuration — swap model/provider here without touching other files
// NOTE: groq-sdk automatically appends /openai/v1 to the baseURL internally.
// Do NOT include /openai/v1 in the baseURL — it will result in a double-path error.
export const AI_CONFIG = {
  provider: 'groq' as const,
  // groq-sdk default is https://api.groq.com — just override if needed
  baseURL: process.env.GROQ_BASE_URL ?? 'https://api.groq.com',
  // Valid Groq models: llama-3.3-70b-versatile, llama-3.1-8b-instant, mixtral-8x7b-32768
  model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
  apiKeyEnvVar: 'GROQ_API_KEY',
  maxRetries: 3,
  timeoutMs: 60_000,
} as const;

export type AIProvider = typeof AI_CONFIG.provider;
