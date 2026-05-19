import * as vscode from 'vscode';

/**
 * Service for managing extension configuration and API keys.
 * Uses VS Code SecretStorage to keep API keys secure.
 */
export class ConfigService {
  private readonly secrets: vscode.SecretStorage;

  constructor(context: vscode.ExtensionContext) {
    this.secrets = context.secrets;
  }

  /**
   * Retrieves the API key for a provider from secure storage.
   * @param provider - The AI provider name (claude, openai)
   * @returns The stored API key, or undefined if not set
   */
  async getApiKey(provider: string): Promise<string | undefined> {
    return this.secrets.get(`commitGen.${provider}.apiKey`);
  }

  /**
   * Stores an API key in secure storage.
   * @param provider - The AI provider name
   * @param key - The API key to store
   */
  async setApiKey(provider: string, key: string): Promise<void> {
    await this.secrets.store(`commitGen.${provider}.apiKey`, key);
  }

  /**
   * Prompts the user to enter an API key via input box.
   * Validates the key format before storing.
   * @param provider - The AI provider (claude or openai)
   * @returns The entered key, or undefined if cancelled
   */
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

  /**
   * Gets the configured commit message style.
   * @returns The style (conventional, emoji, or detailed)
   */
  getStyle(): string {
    return vscode.workspace
      .getConfiguration('commitGen')
      .get<string>('style', 'conventional');
  }

  /**
   * Gets the configured maximum commit message length.
   * @returns The max length in characters
   */
  getMaxLength(): number {
    return vscode.workspace
      .getConfiguration('commitGen')
      .get<number>('maxLength', 72);
  }

  /**
   * Gets the configured AI backend.
   * @returns The backend name (claude, openai, ollama, fallback)
   */
  getBackend(): string {
    return vscode.workspace
      .getConfiguration('commitGen')
      .get<string>('backend', 'claude');
  }
}
