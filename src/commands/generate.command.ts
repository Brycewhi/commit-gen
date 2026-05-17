import * as vscode from 'vscode';
import { GitService } from '../services/git.service';
import { ConfigService } from '../services/config.service';
import { CacheService } from '../services/cache.service';
import { OpenAIBackend } from '../backends/openai.backend';
import { FallbackBackend } from '../backends/fallback.backend';

export class GenerateCommand {
  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly gitService: GitService,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {}

  async execute(): Promise<void> {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Generating commit message...',
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
  }

  private async run(): Promise<void> {
    // Step 1: get staged diff
    const diffSummary = await this.gitService.getStagedDiff();
    if (!diffSummary) {
      vscode.window.showWarningMessage(
        'No staged changes found. Stage your changes first.',
      );
      return;
    }

    const style = this.configService.getStyle();
    const backend = this.configService.getBackend();

    // Step 2: check cache
    const cached = this.cacheService.get(diffSummary.diff, style);
    if (cached) {
      this.setInputBoxValue(cached);
      vscode.window.setStatusBarMessage('✨ Commit message generated! (cached)', 3000);
      return;
    }

    // Step 3: generate
    let message: string;

    if (backend === 'fallback') {
      const fb = new FallbackBackend();
      message = await fb.generate(diffSummary.diff, style);
    } else {
      // openai path — needs a key
      let apiKey = await this.configService.getApiKey('openai');

      if (!apiKey) {
        apiKey = await this.configService.promptForApiKey();
      }

      if (!apiKey) {
        vscode.window.showErrorMessage(
          'Commit Gen: No API key provided. Run the command again and enter your OpenAI key when prompted, or switch to the "fallback" backend in settings.',
        );
        return;
      }

      const openai = new OpenAIBackend(apiKey);
      message = await openai.generate(diffSummary.diff, style);
    }

    // Step 4: cache + populate input box
    this.cacheService.set(diffSummary.diff, style, message);
    this.setInputBoxValue(message);
    vscode.window.setStatusBarMessage('✨ Commit message generated!', 3000);
  }

  private setInputBoxValue(message: string): void {
    // The built-in Git extension exposes its API through its activation exports.
    // We access it here rather than at activation time so we always get the
    // freshest repository list (repos can be added/removed at runtime).
    const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports as
      | { getAPI(version: 1): { repositories: Array<{ inputBox: { value: string } }> } }
      | undefined;

    const api = gitExtension?.getAPI(1);
    const repo = api?.repositories[0];

    if (repo) {
      repo.inputBox.value = message;
    } else {
      // Fallback: copy to clipboard so the message is never lost
      vscode.env.clipboard.writeText(message);
      vscode.window.showInformationMessage(
        `Commit Gen: Could not find git repo input box. Message copied to clipboard.\n\n${message}`,
      );
    }
  }
}
