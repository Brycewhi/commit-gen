import * as vscode from 'vscode';
import { GitService } from '../services/git.service';
import { ConfigService } from '../services/config.service';
import { CacheService } from '../services/cache.service';
import { ClaudeBackend } from '../backends/claude.backend';
import { OpenAIBackend } from '../backends/openai.backend';
import { OllamaBackend } from '../backends/ollama.backend';
import { FallbackBackend } from '../backends/fallback.backend';
import { ERROR_MESSAGES, STATUS_MESSAGES } from '../constants';

/**
 * Command handler for generating commit messages.
 * Coordinates between git, cache, and AI backends.
 */
export class GenerateCommand {
  private isGenerating = false;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly gitService: GitService,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Executes the generate command with progress indication.
   * Prevents double-clicks by tracking generation state.
   */
  async execute(): Promise<void> {
    if (this.isGenerating) {
      return;
    }

    this.isGenerating = true;

    try {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: STATUS_MESSAGES.GENERATING,
          cancellable: false,
        },
        async () => {
          try {
            await this.run();
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            vscode.window.showErrorMessage(`Commit Gen: ${message}`);
          }
        },
      );
    } finally {
      this.isGenerating = false;
    }
  }

  private async run(): Promise<void> {
    const diffSummary = await this.gitService.getStagedDiff();
    if (!diffSummary) {
      vscode.window.showWarningMessage(ERROR_MESSAGES.NO_STAGED_CHANGES);
      return;
    }

    const style = this.configService.getStyle();
    const backend = this.configService.getBackend();

    const cached = this.cacheService.get(diffSummary.diff, style);
    if (cached) {
      this.setInputBoxValue(cached);
      vscode.window.setStatusBarMessage(STATUS_MESSAGES.CACHED, 3000);
      return;
    }

    const message = await this.generateMessage(backend, diffSummary.diff, style);
    if (!message) {
      return;
    }

    this.cacheService.set(diffSummary.diff, style, message);
    this.setInputBoxValue(message);
    vscode.window.setStatusBarMessage(STATUS_MESSAGES.GENERATED, 3000);
  }

  private async generateMessage(
    backend: string,
    diff: string,
    style: string,
  ): Promise<string | null> {
    if (backend === 'fallback') {
      const fb = new FallbackBackend();
      return fb.generate(diff, style);
    }

    if (backend === 'ollama') {
      const ollama = new OllamaBackend();
      return ollama.generate(diff, style);
    }

    if (backend === 'openai') {
      const apiKey = await this.getOrPromptApiKey('openai');
      if (!apiKey) return null;

      const openai = new OpenAIBackend(apiKey);
      return openai.generate(diff, style);
    }

    const apiKey = await this.getOrPromptApiKey('claude');
    if (!apiKey) return null;

    const claude = new ClaudeBackend(apiKey);
    return claude.generate(diff, style);
  }

  private async getOrPromptApiKey(provider: 'openai' | 'claude'): Promise<string | null> {
    let apiKey = await this.configService.getApiKey(provider);

    if (!apiKey) {
      apiKey = await this.configService.promptForApiKey(provider);
    }

    if (!apiKey) {
      vscode.window.showErrorMessage(ERROR_MESSAGES.NO_API_KEY(provider));
      return null;
    }

    return apiKey;
  }

  private setInputBoxValue(message: string): void {
    const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports as
      | { getAPI(version: 1): { repositories: Array<{ inputBox: { value: string } }> } }
      | undefined;

    const api = gitExtension?.getAPI(1);
    const repo = api?.repositories[0];

    if (repo) {
      repo.inputBox.value = message;
    } else {
      vscode.env.clipboard.writeText(message);
      vscode.window.showInformationMessage(
        `Commit Gen: Could not find git repo input box. Message copied to clipboard.`,
      );
    }
  }
}
