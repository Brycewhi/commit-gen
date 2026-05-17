import Anthropic from '@anthropic-ai/sdk';
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

export class ClaudeBackend implements Backend {
  private readonly client: Anthropic;

  constructor(private readonly apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey);
  }

  async generate(diff: string, style: string): Promise<string> {
    const systemPrompt = SYSTEM_PROMPTS[style] ?? SYSTEM_PROMPTS['conventional'];

    let response;
    try {
      response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 150,
        system: systemPrompt,
        messages: [
          { role: 'user', content: `Diff:\n${diff}` },
        ],
      });
    } catch (err: unknown) {
      if (err instanceof Anthropic.APIError) {
        if (err.status === 401) {
          throw new Error('Invalid API key. Please check your Anthropic key in settings.');
        }
        if (err.status === 429) {
          throw new Error('Anthropic rate limit exceeded. Please try again in a moment.');
        }
        throw new Error(`Anthropic API error: ${err.message}`);
      }
      throw err;
    }

    const content = response.content[0];
    if (content.type !== 'text' || !content.text.trim()) {
      throw new Error('Claude returned an empty response.');
    }
    return content.text.trim();
  }
}
