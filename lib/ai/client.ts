import Groq from 'groq-sdk';
import { AI_CONFIG } from '@/lib/config';

// 1. Discover all Groq API keys from environment variables
const keys = Object.keys(process.env)
  .filter(key => key.startsWith('GROQ_API_KEY'))
  .map(key => process.env[key])
  .filter(Boolean) as string[];

if (keys.length === 0) {
  // Graceful fallback during build step if env variables aren't loaded yet
  if (process.env.NODE_ENV !== 'production') {
    keys.push('dummy_key_for_build');
  } else {
    throw new Error('No GROQ_API_KEY environment variables found.');
  }
}

// 2. Instantiate a pool of Groq clients (one for each key)
const clients = keys.map(apiKey => new Groq({
  apiKey,
  timeout: AI_CONFIG.timeoutMs,
  maxRetries: 0, // We handle retries and exponential backoff manually
}));

// 3. Centralized State Manager for Key Rotation
let currentKeyIndex = 0;
const maxRetries = 6; // Maximum attempts across all keys before giving up

/**
 * Core engine for executing requests with automatic key rotation and failover.
 */
async function executeWithRotation(args: any[]) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const client = clients[currentKeyIndex];
    try {
      console.log(`[Groq Manager] Request Started | Using Groq Key #${currentKeyIndex + 1} | Attempt ${attempt}/${maxRetries}`);
      
      // Execute the request on the current selected client
      return await client.chat.completions.create(args[0] as any, args[1]);
      
    } catch (error: any) {
      const status = error?.status;
      const message = error?.error?.message || error?.message || 'Unknown Groq error';

      // Identify if it's a rate limit or quota exceeded error
      const isRateLimit = status === 429 || 
                          message.toLowerCase().includes('rate limit') || 
                          message.toLowerCase().includes('quota');
      
      if (!isRateLimit) {
        // Immediately throw permanent errors (400, 401, 403, invalid prompt, etc.)
        console.error(`[Groq Manager] Permanent Error on Key #${currentKeyIndex + 1}: ${message}`);
        throw error;
      }

      console.warn(`[Groq Manager] 429 Rate Limit Detected on Key #${currentKeyIndex + 1}.`);
      
      // Rotate to the next available key (Round-Robin)
      currentKeyIndex = (currentKeyIndex + 1) % clients.length;
      console.log(`[Groq Manager] Switching to Groq Key #${currentKeyIndex + 1}...`);

      if (attempt === maxRetries) {
        console.error('[Groq Manager] All configured API keys are temporarily rate limited. Maximum retries reached.');
        throw new Error('AI service is temporarily busy. Please try again after a few minutes.');
      }

      // Exponential backoff for temporary failures
      // 1s, 2s, 4s, 8s, up to a maximum of 10s delay between retries
      const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`[Groq Manager] Retrying in ${backoffMs}ms...`);
      await new Promise(res => setTimeout(res, backoffMs));
    }
  }
}

// 4. Proxy Client Implementation
let _proxyClient: Groq | null = null;

export function getAIClient(): Groq {
  if (_proxyClient) return _proxyClient;

  // We proxy the first client in the pool. It acts as the public face of the AI client.
  const baseClient = clients[0];

  // Intercept chat.completions.create
  const chatCompletionsProxy = new Proxy(baseClient.chat.completions, {
    get(target, prop, receiver) {
      if (prop === 'create') {
        return async (...args: any[]) => {
          return executeWithRotation(args);
        };
      }
      return Reflect.get(target, prop, receiver);
    }
  });

  // Intercept chat module
  const chatProxy = new Proxy(baseClient.chat, {
    get(target, prop, receiver) {
      if (prop === 'completions') {
        return chatCompletionsProxy;
      }
      return Reflect.get(target, prop, receiver);
    }
  });

  // Intercept root Groq instance
  _proxyClient = new Proxy(baseClient, {
    get(target, prop, receiver) {
      if (prop === 'chat') {
        return chatProxy;
      }
      return Reflect.get(target, prop, receiver);
    }
  });

  return _proxyClient;
}
