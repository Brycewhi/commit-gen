import OpenAI from 'openai';
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

export class OpenAIBackend implements Backend {
  private readonly client: OpenAI;

  constructor(private readonly apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey);
  }

  async generate(diff: string, style: string): Promise<string> {
    const systemPrompt = SYSTEM_PROMPTS[style] ?? SYSTEM_PROMPTS['conventional'];

    let response;
    try {
      response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        max_tokens: 150,
        temperature: 0.7,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Diff:\n${diff}` },
        ],
      });
    } catch (err: unknown) {
      // Map OpenAI SDK error codes to user-friendly messages
      if (err instanceof OpenAI.APIError) {
        if (err.status === 401) {
          throw new Error('Invalid API key. Please check your OpenAI key in settings.');
        }
        if (err.status === 429) {
          throw new Error('OpenAI rate limit exceeded. Please try again in a moment.');
        }
        throw new Error(`OpenAI API error: ${err.message}`);
      }
      throw err;
    }

    const message = response.choices[0]?.message?.content?.trim();
    if (!message) {
      throw new Error('OpenAI returned an empty response.');
    }
    return message;
  }
}
