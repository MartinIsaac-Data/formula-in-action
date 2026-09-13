import { createHash } from 'node:crypto';
import type { ExplainRequest, ExplanationResult } from '@formula-in-action/shared-types';

export interface ExplainCacheOptions {
  /** Maximum entries held. `0` disables the cache entirely. */
  maxEntries: number;
  ttlMs: number;
  /** Injectable clock for deterministic tests. */
  now?: () => number;
}

interface Entry {
  result: ExplanationResult;
  expiresAt: number;
}

/**
 * An explanation is a pure function of (formula, mode, context, locale, model),
 * so identical requests can be served without paying the model again. Switching
 * mode or context in the task pane — the most common interaction — becomes
 * instant and free once a formula has been seen.
 *
 * In-process and bounded on purpose: no external dependency to operate, and a
 * deploy (which is the only thing that changes how a formula is explained)
 * restarts the process and therefore empties the cache. That is the invalidation
 * strategy — there is no engine version in the key because there does not need
 * to be one.
 */
export class ExplainCache {
  private readonly entries = new Map<string, Entry>();
  private readonly maxEntries: number;
  private readonly ttlMs: number;
  private readonly now: () => number;
  private hits = 0;
  private misses = 0;

  constructor(options: ExplainCacheOptions) {
    this.maxEntries = options.maxEntries;
    this.ttlMs = options.ttlMs;
    this.now = options.now ?? Date.now;
  }

  get enabled(): boolean {
    return this.maxEntries > 0;
  }

  get stats(): { size: number; hits: number; misses: number } {
    return { size: this.entries.size, hits: this.hits, misses: this.misses };
  }

  get(request: ExplainRequest, model: string): ExplanationResult | undefined {
    if (!this.enabled) return undefined;

    const key = cacheKey(request, model);
    const entry = this.entries.get(key);
    if (!entry) {
      this.misses += 1;
      return undefined;
    }
    if (entry.expiresAt <= this.now()) {
      this.entries.delete(key);
      this.misses += 1;
      return undefined;
    }

    // Re-insert to move this key to the most-recently-used end of the Map.
    this.entries.delete(key);
    this.entries.set(key, entry);
    this.hits += 1;
    return entry.result;
  }

  set(request: ExplainRequest, model: string, result: ExplanationResult): void {
    if (!this.enabled) return;
    // Never cache a degraded result: a transient provider outage would otherwise
    // pin the template fallback in front of every later request for that formula.
    if (result.meta.degraded) return;

    const key = cacheKey(request, model);
    this.entries.delete(key);
    this.entries.set(key, { result, expiresAt: this.now() + this.ttlMs });

    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next();
      if (oldest.done) break;
      this.entries.delete(oldest.value);
    }
  }
}

/**
 * The formula is hashed rather than stored in the key, so nothing holding a
 * user's formula text sits in a long-lived map (the same reason formulas are
 * kept out of logs by default).
 */
function cacheKey(request: ExplainRequest, model: string): string {
  const formulaHash = createHash('sha256').update(request.formula).digest('hex');
  return [formulaHash, request.mode, request.context, request.locale, model].join('|');
}
