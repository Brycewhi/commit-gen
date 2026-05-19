export const API_TIMEOUT_MS = 30_000;
export const MAX_RETRIES = 3;
export const INITIAL_RETRY_DELAY_MS = 1_000;

export const CACHE_TTL_SECONDS = 86_400;
export const MAX_DIFF_CHARS = 10_000;

export const OLLAMA_HOST = 'http://localhost:11434';
export const OLLAMA_DEFAULT_MODEL = 'llama3';

export const OPENAI_MODEL = 'gpt-4o-mini';
export const CLAUDE_MODEL = 'claude-sonnet-4-5';

export const SYSTEM_PROMPTS: Record<string, string> = {
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

export const ERROR_MESSAGES = {
  OPENAI_INVALID_KEY: 'Invalid OpenAI API key. Check your key in settings.',
  OPENAI_RATE_LIMIT: 'OpenAI rate limit exceeded. Retrying...',
  OPENAI_RATE_LIMIT_EXHAUSTED: 'OpenAI rate limit exceeded. Please try again later.',
  OPENAI_INSUFFICIENT_QUOTA: 'OpenAI quota exceeded. Add credits at platform.openai.com.',
  OPENAI_EMPTY_RESPONSE: 'OpenAI returned an empty response.',

  CLAUDE_INVALID_KEY: 'Invalid Anthropic API key. Check your key in settings.',
  CLAUDE_RATE_LIMIT: 'Anthropic rate limit exceeded. Please try again later.',
  CLAUDE_INSUFFICIENT_CREDITS: 'Anthropic credits exhausted. Add credits at console.anthropic.com.',
  CLAUDE_EMPTY_RESPONSE: 'Claude returned an empty response.',

  OLLAMA_NOT_RUNNING: 'Ollama not running. Start with: ollama serve',
  OLLAMA_MODEL_NOT_FOUND: (model: string) => `Model not found. Run: ollama pull ${model}`,
  OLLAMA_EMPTY_RESPONSE: 'Ollama returned an empty response.',

  NO_STAGED_CHANGES: 'No staged changes. Stage files with git add first.',
  NO_WORKSPACE: 'No workspace folder open.',
  NO_GIT_REPO: 'Not a git repository. Initialize with: git init',
  NO_API_KEY: (provider: string) =>
    `No ${provider} API key. Enter your key when prompted or switch to Ollama (free/local) in settings.`,

  TIMEOUT: 'Request timed out. Check your connection and try again.',
} as const;

export const STATUS_MESSAGES = {
  GENERATED: '✨ Commit message generated!',
  CACHED: '⚡ Generated from cache',
  GENERATING: 'Generating commit message...',
} as const;

export const WELCOME_MESSAGE =
  'Commit Gen ready! Choose a backend in settings: Ollama (free/private), Claude, or OpenAI';

export const FIRST_RUN_KEY = 'commitGen.hasShownWelcome';
