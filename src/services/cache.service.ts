import NodeCache from 'node-cache';

// 24-hour TTL: diffs are deterministic for a given repo state, so this is safe
const TTL_SECONDS = 86_400;

export class CacheService {
  private readonly cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({ stdTTL: TTL_SECONDS });
  }

  // Use the first 100 chars of the diff as a cheap key — two diffs that share
  // the same opening 100 chars AND style are almost certainly identical in intent
  private makeKey(diff: string, style: string): string {
    return `${diff.slice(0, 100)}::${style}`;
  }

  get(diff: string, style: string): string | undefined {
    return this.cache.get<string>(this.makeKey(diff, style));
  }

  set(diff: string, style: string, message: string): void {
    this.cache.set(this.makeKey(diff, style), message);
  }

  clear(): void {
    this.cache.flushAll();
  }
}
