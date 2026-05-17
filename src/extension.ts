import * as vscode from 'vscode';
import { GitService } from './services/git.service';
import { ConfigService } from './services/config.service';
import { CacheService } from './services/cache.service';
import { GenerateCommand } from './commands/generate.command';

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

  // registerCommand returns a Disposable — pushing it to subscriptions ensures
  // VS Code cleans it up when the extension is deactivated or the window closes
  const disposable = vscode.commands.registerCommand(
    'commit-gen.generate',
    () => generateCommand.execute(),
  );

  context.subscriptions.push(disposable);
  console.log('Commit Gen activated');
}

export function deactivate(): void {
  // VS Code handles cleanup via context.subscriptions; nothing extra needed here
}
