import * as vscode from 'vscode';
import simpleGit from 'simple-git';
import parseDiff from 'parse-diff';
import { DiffSummary } from '../types';

// Files that add noise without helping the AI understand intent
const NOISE_PATTERNS = [
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'node_modules',
  '.min.js',
  '.min.css',
  'dist/',
];

const MAX_DIFF_CHARS = 10_000;

export class GitService {
  async getStagedDiff(): Promise<DiffSummary | null> {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
      return null;
    }

    const git = simpleGit(workspaceRoot);

    const rawDiff = await git.diff(['--cached']);
    if (!rawDiff.trim()) {
      return null;
    }

    const optimized = this.optimizeDiff(rawDiff);

    // parse-diff gives us structured file/hunk data so we can count accurately
    const files = parseDiff(rawDiff);
    let additions = 0;
    let deletions = 0;
    for (const file of files) {
      for (const chunk of file.chunks) {
        for (const change of chunk.changes) {
          if (change.type === 'add') additions++;
          if (change.type === 'del') deletions++;
        }
      }
    }

    return {
      filesChanged: files.length,
      additions,
      deletions,
      diff: optimized,
    };
  }

  private optimizeDiff(raw: string): string {
    // Split into per-file sections (each starts with "diff --git")
    const sections = raw.split(/^(?=diff --git)/m);

    const kept = sections.filter((section) => {
      return !NOISE_PATTERNS.some((pattern) => section.includes(pattern));
    });

    let result = kept.join('');

    if (result.length > MAX_DIFF_CHARS) {
      // Keep as many complete lines as we can under the limit, then append a notice
      const lines = result.split('\n');
      const truncated: string[] = [];
      let total = 0;
      for (const line of lines) {
        if (total + line.length + 1 > MAX_DIFF_CHARS) break;
        truncated.push(line);
        total += line.length + 1;
      }
      result = truncated.join('\n') + '\n\n[diff truncated for length]';
    }

    return result;
  }
}
