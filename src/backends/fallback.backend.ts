import { Backend } from '../types';

/**
 * Heuristic-based fallback backend.
 * Generates basic commit messages without any API calls.
 * Always available, never fails.
 */
export class FallbackBackend implements Backend {
  /**
   * Always returns true since no external dependencies are required.
   */
  async isAvailable(): Promise<boolean> {
    return true;
  }

  /**
   * Generates a commit message using simple heuristics.
   * @param diff - The git diff to analyze
   * @param style - The commit message style (conventional, emoji, detailed)
   * @returns A basic commit message based on diff patterns
   */
  async generate(diff: string, style: string): Promise<string> {
    const type = this.detectType(diff);
    const fileCount = this.countFiles(diff);

    const subject =
      fileCount > 1
        ? `${type}: update ${fileCount} files`
        : `${type}: add new functionality`;

    if (style === 'emoji') {
      const emoji = this.typeToEmoji(type);
      return `${emoji} ${subject.replace(/^\w+: /, '')}`;
    }

    if (style === 'detailed') {
      return `${subject}\n\nUpdated files to improve the codebase. Review the diff for full details.`;
    }

    return subject;
  }

  private detectType(diff: string): string {
    if (diff.includes('package.json')) return 'chore';
    if (/test|spec/i.test(diff)) return 'test';
    if (/README|\.md/i.test(diff)) return 'docs';
    if (diff.includes('new file mode')) return 'feat';
    return 'refactor';
  }

  private countFiles(diff: string): number {
    return (diff.match(/^diff --git/gm) ?? []).length;
  }

  private typeToEmoji(type: string): string {
    const map: Record<string, string> = {
      feat: '✨',
      fix: '🐛',
      docs: '📝',
      chore: '🔧',
      test: '✅',
      refactor: '♻️',
      perf: '⚡',
      style: '💄',
    };
    return map[type] ?? '🔨';
  }
}
