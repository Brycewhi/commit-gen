import NodeCache from 'node-cache';
import { CACHE_TTL_SECONDS } from '../constants';

/**
 * In-memory cache service for commit messages.
 * Prevents redundant API calls for identical diffs.
 */
export class CacheService {
  private readonly cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({ stdTTL: CACHE_TTL_SECONDS });
  }

  /**
   * Retrieves a cached commit message for the given diff and style.
   * @param diff - The git diff content
   * @param style - The commit message style
   * @returns The cached message, or undefined if not found
   */
  get(diff: string, style: string): string | undefined {
    return this.cache.get<string>(this.makeKey(diff, style));
  }

  /**
   * Stores a commit message in the cache.
   * @param diff - The git diff content
   * @param style - The commit message style
   * @param message - The generated commit message
   */
  set(diff: string, style: string, message: string): void {
    this.cache.set(this.makeKey(diff, style), message);
  }

  /**
   * Clears all cached entries.
   */
  clear(): void {
    this.cache.flushAll();
  }

  private makeKey(diff: string, style: string): string {
    return `${diff.slice(0, 100)}::${style}`;
  }
}
