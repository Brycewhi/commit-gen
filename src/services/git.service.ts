import * as vscode from 'vscode';
import simpleGit from 'simple-git';
import parseDiff from 'parse-diff';
import { DiffSummary } from '../types';
import { MAX_DIFF_CHARS } from '../constants';

const NOISE_PATTERNS = [
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'node_modules',
  '.min.js',
  '.min.css',
  'dist/',
];

/**
 * Service for interacting with git repositories.
 * Retrieves and optimizes staged diffs for AI processing.
 */
export class GitService {
  /**
   * Gets the staged diff from the current workspace.
   * Filters noise files and truncates large diffs.
   * @returns DiffSummary with optimized diff, or null if no staged changes
   * @throws Error if workspace is not a git repository
   */
  async getStagedDiff(): Promise<DiffSummary | null> {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
      return null;
    }

    const git = simpleGit(workspaceRoot);

    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      throw new Error('Not a git repository. Initialize with: git init');
    }

    const rawDiff = await git.diff(['--cached']);
    if (!rawDiff.trim()) {
      return null;
    }

    const optimized = this.optimizeDiff(rawDiff);

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
    const sections = raw.split(/^(?=diff --git)/m);

    const kept = sections.filter((section) => {
      return !NOISE_PATTERNS.some((pattern) => section.includes(pattern));
    });

    let result = kept.join('');

    if (result.length > MAX_DIFF_CHARS) {
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
