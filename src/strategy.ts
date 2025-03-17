import type { CacheEntry } from './cache.js';
import fs from 'node:fs/promises';

interface ExtendedCacheEntry extends CacheEntry {
  size: number;
}

export interface CacheStrategy {
  (entries: ExtendedCacheEntry[]): ExtendedCacheEntry[];
}

export const extendCacheEntry = (entry: CacheEntry): ExtendedCacheEntry => {
  const size = Buffer.from(JSON.stringify(entry)).toString('utf-8').length;

  return { ...entry, size };
};

export const defaultStrategy: CacheStrategy = (entries) => entries.sort((a, b) => b.timestamp - a.timestamp).slice(0, 3);

export const applyStrategy = async (entries: CacheEntry[], strategy: CacheStrategy = defaultStrategy) => {
  const paths = entries.map((entry) => entry.path);
  const keep = strategy(entries.map((entry) => extendCacheEntry(entry))).map(({ path }) => path);

  const remove = paths.filter((path) => !keep.includes(path));

  for await (const path of remove) {
    await fs.rm(path, { recursive: true });
  }

  return remove;
};
