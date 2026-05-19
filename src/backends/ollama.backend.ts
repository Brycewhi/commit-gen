import { Ollama } from 'ollama';
import { Backend } from '../types';

const SYSTEM_PROMPTS: Record<string, string> = {
  conventional: `You are an expert at writing git commit messages.
Generate a single conventional commit message for the following diff.
Format: <type>(<scope>): <description>
Types: feat, fix, docs, style, refactor, perf, test, chore
Rules: lowercase only, imperative mood, max 72 chars, no period at end.
Respond with ONLY the commit message, nothing else.`,

  emoji: `Generate a single git commit message with an emoji prefix.
Format: <emoji> <description>
Example: ✨ add user authentication feature
Rules: max 72 chars, imperative mood, one relevant emoji.
Respond with ONLY the commit message, nothing else.`,

  detailed: `Generate a git commit message with a subject and body.
Format:
<type>: <subject>

<body explaining what and why, 2-3 sentences>

Rules: subject max 72 chars, body wrapped at 72 chars.
Respond with ONLY the commit message, nothing else.`,
};

const DEFAULT_MODEL = 'llama3';
const OLLAMA_HOST = 'http://localhost:11434';

export class OllamaBackend implements Backend {
  private readonly client: Ollama;
  private readonly model: string;

  constructor(model: string = DEFAULT_MODEL) {
    this.client = new Ollama({ host: OLLAMA_HOST });
    this.model = model;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(OLLAMA_HOST);
      return response.ok;
    } catch {
      return false;
    }
  }

  async generate(diff: string, style: string): Promise<string> {
    const systemPrompt = SYSTEM_PROMPTS[style] ?? SYSTEM_PROMPTS['conventional'];

    const available = await this.isAvailable();
    if (!available) {
      throw new Error(
        'Ollama is not running. To use Ollama:\n' +
        '1. Install Ollama from https://ollama.ai\n' +
        '2. Run: ollama run llama3\n' +
        '3. Try generating again'
      );
    }

    let response;
    try {
      response = await this.client.chat({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Diff:\n${diff}` },
        ],
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('model') && err.message.includes('not found')) {
          throw new Error(
            `Model "${this.model}" not found. Run: ollama pull ${this.model}`
          );
        }
        throw new Error(`Ollama error: ${err.message}`);
      }
      throw err;
    }

    const message = response.message?.content?.trim();
    if (!message) {
      throw new Error('Ollama returned an empty response.');
    }
    return message;
  }
}
