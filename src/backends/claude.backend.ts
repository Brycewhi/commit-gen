import Anthropic from '@anthropic-ai/sdk';
import { Backend } from '../types';
import {
  API_TIMEOUT_MS,
  CLAUDE_MODEL,
  SYSTEM_PROMPTS,
  ERROR_MESSAGES,
} from '../constants';

/**
 * Backend for generating commit messages using Anthropic's Claude API.
 */
export class ClaudeBackend implements Backend {
  private readonly client: Anthropic;

  constructor(private readonly apiKey: string) {
    this.client = new Anthropic({
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
   * @param diff - The git diff to analyze
   * @param style - The commit message style (conventional, emoji, detailed)
   * @returns The generated commit message
   * @throws Error if the API call fails
   */
  async generate(diff: string, style: string): Promise<string> {
    const systemPrompt = SYSTEM_PROMPTS[style] ?? SYSTEM_PROMPTS['conventional'];

    let response;
    try {
      response = await this.client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 150,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Diff:\n${diff}` }],
      });
    } catch (err: unknown) {
      if (err instanceof Anthropic.APIError) {
        if (err.status === 401) {
          throw new Error(ERROR_MESSAGES.CLAUDE_INVALID_KEY);
        }
        if (err.status === 429) {
          throw new Error(ERROR_MESSAGES.CLAUDE_RATE_LIMIT);
        }
        if (err.status === 400 && err.message.includes('credit')) {
          throw new Error(ERROR_MESSAGES.CLAUDE_INSUFFICIENT_CREDITS);
        }
        throw new Error(`Anthropic API error: ${err.message}`);
      }
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(ERROR_MESSAGES.TIMEOUT);
      }
      throw err;
    }

    const content = response.content[0];
    if (content.type !== 'text' || !content.text.trim()) {
      throw new Error(ERROR_MESSAGES.CLAUDE_EMPTY_RESPONSE);
    }
    return content.text.trim();
  }
}
