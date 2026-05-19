import OpenAI from 'openai';
import { Backend } from '../types';
import {
  API_TIMEOUT_MS,
  OPENAI_MODEL,
  SYSTEM_PROMPTS,
  ERROR_MESSAGES,
  MAX_RETRIES,
  INITIAL_RETRY_DELAY_MS,
} from '../constants';

/**
 * Backend for generating commit messages using OpenAI's API.
 * Includes retry logic with exponential backoff for rate limits.
 */
export class OpenAIBackend implements Backend {
  private readonly client: OpenAI;

  constructor(private readonly apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      timeout: API_TIMEOUT_MS,
    });
  }

  /**
   * Checks if the backend has a valid API key configured.
   */
  async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey);
  }

  /**
   * Generates a commit message from the provided diff.
   * Retries with exponential backoff on rate limit errors.
   * @param diff - The git diff to analyze
   * @param style - The commit message style (conventional, emoji, detailed)
   * @returns The generated commit message
   * @throws Error if the API call fails after all retries
   */
  async generate(diff: string, style: string): Promise<string> {
    const systemPrompt = SYSTEM_PROMPTS[style] ?? SYSTEM_PROMPTS['conventional'];

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await this.client.chat.completions.create({
          model: OPENAI_MODEL,
          max_tokens: 150,
          temperature: 0.7,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Diff:\n${diff}` },
          ],
        });

        const message = response.choices[0]?.message?.content?.trim();
        if (!message) {
          throw new Error(ERROR_MESSAGES.OPENAI_EMPTY_RESPONSE);
        }
        return message;
      } catch (err: unknown) {
        if (err instanceof OpenAI.APIError) {
          if (err.status === 401) {
            throw new Error(ERROR_MESSAGES.OPENAI_INVALID_KEY);
          }
          if (err.status === 429) {
            if (err.message.includes('quota') || err.message.includes('insufficient')) {
              throw new Error(ERROR_MESSAGES.OPENAI_INSUFFICIENT_QUOTA);
            }
            if (attempt < MAX_RETRIES - 1) {
              const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
              await this.sleep(delay);
              lastError = new Error(ERROR_MESSAGES.OPENAI_RATE_LIMIT);
              continue;
            }
            throw new Error(ERROR_MESSAGES.OPENAI_RATE_LIMIT_EXHAUSTED);
          }
          throw new Error(`OpenAI API error: ${err.message}`);
        }
        if (err instanceof Error && err.name === 'AbortError') {
          throw new Error(ERROR_MESSAGES.TIMEOUT);
        }
        throw err;
      }
    }

    throw lastError ?? new Error('Unknown error during generation');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
