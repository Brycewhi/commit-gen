import { Backend } from '../types';

// Heuristic-based backend — never fails, no API key required
export class FallbackBackend implements Backend {
  async isAvailable(): Promise<boolean> {
    return true;
  }

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
    // "new file mode" appears in git diff output when a file is first added
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
