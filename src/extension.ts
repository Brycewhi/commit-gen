import * as vscode from 'vscode';
import { GitService } from './services/git.service';
import { ConfigService } from './services/config.service';
import { CacheService } from './services/cache.service';
import { GenerateCommand } from './commands/generate.command';

console.log('[commit-gen] module loaded');

export function activate(context: vscode.ExtensionContext): void {
  console.log('[commit-gen] activate() called');
  try {
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
    console.log('[commit-gen] command registered successfully');
  } catch (err) {
    console.error('[commit-gen] activation failed:', err);
    throw err;
  }
}

export function deactivate(): void {
  // VS Code handles cleanup via context.subscriptions; nothing extra needed here
}
