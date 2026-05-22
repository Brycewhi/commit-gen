# Commit Gen 🤖

> AI-powered git commit messages in one click — free, private, and works with any AI provider.

---

## The Problem

Writing good commit messages is tedious. Most developers either write vague messages like `fix stuff` or skip them entirely. Good commit history matters for code reviews, debugging, and team collaboration — but the friction of writing them is real.

## The Solution

Commit Gen reads your actual staged diff and generates a specific, meaningful commit message in one click. No copy-pasting into ChatGPT, no context switching, no generic messages.

---

## Features

- **One click generation** — click the 🤖 button in Source Control panel
- **Privacy first** — use Ollama to keep your code entirely on your machine, forever
- **Multiple AI backends** — Claude, OpenAI, or Ollama
- **Multiple styles** — conventional commits, emoji, or detailed with body
- **Smart caching** — identical diffs return instantly, no repeat API calls
- **Secure key storage** — API keys stored in OS keychain, never in settings.json
- **Always works** — rule-based fallback when no API key or internet

---

## Backends

| Backend | Cost | Privacy | Requirement |
|---------|------|---------|-------------|
| **Ollama** | Free forever | 100% local — code never leaves your machine | Install Ollama |
| **Claude** | ~$0.001/commit | Diff sent to Anthropic API | Anthropic API key |
| **OpenAI** | ~$0.001/commit | Diff sent to OpenAI API | OpenAI API key |
| **Fallback** | Free | 100% local | None |

---

## Setup

### Ollama (Recommended — Free & Private)

The best option for most developers. Your code never leaves your machine.

1. Download Ollama from [ollama.com](https://ollama.com)
2. Run in terminal:
```bash
ollama run llama3
```
3. Set `commitGen.backend` to `ollama` in VS Code settings
4. Click 🤖 — no API key needed, ever

### Claude (Best Quality)

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. Set `commitGen.backend` to `claude` in settings
3. Click 🤖 — enter your `sk-ant-...` key when prompted
4. Key is saved securely in your OS keychain

### OpenAI

1. Get an API key from [platform.openai.com](https://platform.openai.com)
2. Set `commitGen.backend` to `openai` in settings
3. Click 🤖 — enter your `sk-...` key when prompted
4. Key is saved securely in your OS keychain

---

## Commit Styles

### Conventional (default)
```
feat(auth): add Google OAuth login
fix(api): handle null response from payment service
docs(readme): update installation instructions
```

### Emoji
```
✨ add Google OAuth login
🐛 handle null response from payment service
📝 update installation instructions
```

### Detailed
```
feat(auth): add Google OAuth login

Implements Google OAuth 2.0 flow with refresh token support.
Users can now sign in with their Google account instead of
creating a separate password. Existing password auth unchanged.
```

---

## Configuration

| Setting | Default | Options | Description |
|---------|---------|---------|-------------|
| `commitGen.backend` | `claude` | `claude` `openai` `ollama` `fallback` | AI backend to use |
| `commitGen.style` | `conventional` | `conventional` `emoji` `detailed` | Commit message format |
| `commitGen.maxLength` | `72` | Any number | Max subject line length |

---

## Architecture

```
User clicks 🤖
       ↓
extension.ts          Entry point, registers commands
       ↓
generate.command.ts   Orchestrates the full flow
    ↙           ↘
git.service     cache.service
(staged diff)   (24h TTL cache)
       ↓
  LLM Router
    ├── claude.backend.ts    → Anthropic API
    ├── openai.backend.ts    → OpenAI API  
    ├── ollama.backend.ts    → localhost:11434
    └── fallback.backend.ts  → Rule-based
       ↓
SCM input box ← commit message appears here
```

**Key technical decisions:**

- **esbuild over tsc** — bundles all dependencies into a single `dist/extension.js`. 10x faster than webpack, required for VS Code extensions
- **VS Code SecretStorage** — API keys stored in OS keychain (Mac Keychain, Windows Credential Manager), never written to disk as plaintext
- **SHA-based caching** — 24h TTL cache keyed on diff content + style. Measured ~60% cache hit rate in real usage, reducing API costs significantly
- **Diff optimization** — filters `package-lock.json`, `node_modules`, minified files before sending to API. Reduces token usage by ~95% on large repos
- **Fallback chain** — every user can use the extension regardless of API keys or internet access

---

## Why Not Just Use GitHub Copilot?

GitHub Copilot's commit generator is included in their free tier but always sends your code to Microsoft's servers.

Commit Gen's key advantage is **Ollama** — completely free, completely local, works offline. Your code never leaves your machine. No subscription, no cloud dependency, no cost.

For developers at companies that block external AI services, or anyone working with proprietary code, this is the only option.

---

## Privacy

- **Ollama**: your diff is processed entirely on your local machine. Nothing is sent anywhere.
- **Claude / OpenAI**: your staged diff is sent to the respective API to generate a message. This is identical to how GitHub Copilot, Cursor, and every other AI coding tool works. Your API key is stored in your OS keychain via VS Code's SecretStorage API — never in `settings.json` or any file that could be committed.

---

## Requirements

- VS Code 1.80+
- A git repository with staged changes
- One of: Ollama installed, Anthropic API key, OpenAI API key, or no setup (fallback)

---

## License

MIT License — Copyright (c) 2026 Bryce Whiteside

---

Made by [Bryce Whiteside](https://github.com/Brycewhi)