import { Ollama } from 'ollama';
import { Backend } from '../types';
import {
  OLLAMA_HOST,
  OLLAMA_DEFAULT_MODEL,
  SYSTEM_PROMPTS,
  ERROR_MESSAGES,
  API_TIMEOUT_MS,
} from '../constants';

/**
 * Backend for generating commit messages using local Ollama instance.
 * Provides free, private generation without API keys.
 */
export class OllamaBackend implements Backend {
  private readonly client: Ollama;
  private readonly model: string;

  constructor(model: string = OLLAMA_DEFAULT_MODEL) {
    this.client = new Ollama({ host: OLLAMA_HOST });
    this.model = model;
  }

  /**
   * Checks if Ollama server is running and accessible.
   */
  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(OLLAMA_HOST, { signal: controller.signal });
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Generates a commit message from the provided diff.
   * @param diff - The git diff to analyze
   * @param style - The commit message style (conventional, emoji, detailed)
   * @returns The generated commit message
   * @throws Error if Ollama is not running or the model is not found
   */
  async generate(diff: string, style: string): Promise<string> {
    const systemPrompt = SYSTEM_PROMPTS[style] ?? SYSTEM_PROMPTS['conventional'];

    const available = await this.isAvailable();
    if (!available) {
      throw new Error(ERROR_MESSAGES.OLLAMA_NOT_RUNNING);
    }

    let response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

      response = await this.client.chat({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Diff:\n${diff}` },
        ],
      });

      clearTimeout(timeoutId);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          throw new Error(ERROR_MESSAGES.TIMEOUT);
        }
        if (err.message.includes('model') && err.message.includes('not found')) {
          throw new Error(ERROR_MESSAGES.OLLAMA_MODEL_NOT_FOUND(this.model));
        }
        throw new Error(`Ollama error: ${err.message}`);
      }
      throw err;
    }

    const message = response.message?.content?.trim();
    if (!message) {
      throw new Error(ERROR_MESSAGES.OLLAMA_EMPTY_RESPONSE);
    }
    return message;
  }
}
