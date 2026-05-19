import * as vscode from 'vscode';
import { GitService } from './services/git.service';
import { ConfigService } from './services/config.service';
import { CacheService } from './services/cache.service';
import { GenerateCommand } from './commands/generate.command';
import { WELCOME_MESSAGE, FIRST_RUN_KEY } from './constants';

/**
 * Activates the Commit Gen extension.
 * Registers commands and shows welcome message on first run.
 */
export function activate(context: vscode.ExtensionContext): void {
  const configService = new ConfigService(context);
  const gitService = new GitService();
  const cacheService = new CacheService();
  const generateCommand = new GenerateCommand(
    context,
    gitService,
    configService,
    cacheService,
  );

  const disposable = vscode.commands.registerCommand(
    'commit-gen.generate',
    () => generateCommand.execute(),
  );

  context.subscriptions.push(disposable);

  showWelcomeOnFirstRun(context);
}

/**
 * Deactivates the extension. Cleanup handled by VS Code via subscriptions.
 */
export function deactivate(): void {}

async function showWelcomeOnFirstRun(context: vscode.ExtensionContext): Promise<void> {
  const hasShown = context.globalState.get<boolean>(FIRST_RUN_KEY);
  if (!hasShown) {
    await context.globalState.update(FIRST_RUN_KEY, true);
    const action = await vscode.window.showInformationMessage(
      WELCOME_MESSAGE,
      'Open Settings',
    );
    if (action === 'Open Settings') {
      vscode.commands.executeCommand(
        'workbench.action.openSettings',
        'commitGen',
      );
    }
  }
}
