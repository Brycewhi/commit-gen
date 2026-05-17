import * as vscode from 'vscode';

// SecretStorage keeps API keys out of settings.json (which is often committed)
export class ConfigService {
  private readonly secrets: vscode.SecretStorage;

  constructor(context: vscode.ExtensionContext) {
    this.secrets = context.secrets;
  }

  async getApiKey(provider: string): Promise<string | undefined> {
    return this.secrets.get(`commitGen.${provider}.apiKey`);
  }

  async setApiKey(provider: string, key: string): Promise<void> {
    await this.secrets.store(`commitGen.${provider}.apiKey`, key);
  }

  async promptForApiKey(provider: 'claude' | 'openai' = 'claude'): Promise<string | undefined> {
    if (provider === 'claude') {
      const key = await vscode.window.showInputBox({
        title: 'Anthropic API Key',
        prompt: 'Enter your Anthropic API key (starts with sk-ant-)',
        password: true,
        placeHolder: 'sk-ant-...',
        validateInput: (value) => {
          if (!value.startsWith('sk-ant-')) {
            return 'Key must start with "sk-ant-"';
          }
          return undefined;
        },
      });

      if (key) {
        await this.setApiKey('claude', key);
      }

      return key;
    }

    const key = await vscode.window.showInputBox({
      title: 'OpenAI API Key',
      prompt: 'Enter your OpenAI API key (starts with sk-)',
      password: true,
      placeHolder: 'sk-...',
      validateInput: (value) => {
        if (!value.startsWith('sk-')) {
          return 'Key must start with "sk-"';
        }
        return undefined;
      },
    });

    if (key) {
      await this.setApiKey('openai', key);
    }

    return key;
  }

  getStyle(): string {
    return vscode.workspace
      .getConfiguration('commitGen')
      .get<string>('style', 'conventional');
  }

  getMaxLength(): number {
    return vscode.workspace
      .getConfiguration('commitGen')
      .get<number>('maxLength', 72);
  }

  getBackend(): string {
    return vscode.workspace
      .getConfiguration('commitGen')
      .get<string>('backend', 'openai');
  }
}
