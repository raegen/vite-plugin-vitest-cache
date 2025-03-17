import { createMeasurement } from './util.js';
import fg from 'fast-glob';
import { dirname } from 'node:path';
import fs from 'node:fs/promises';
import { CacheEntry } from './cache.js';
import { applyStrategy } from './strategy.js';
import type { ResolvedConfig } from 'vitest/node';
import type { ResolvedConfig as V2ResolvedConfig } from 'vitest2/node';

export const prune = async (output: { [k: string]: CacheEntry }, { vCache }: ResolvedConfig | V2ResolvedConfig) => {
  const pruning = createMeasurement(`Pruned`, vCache.silent);
  const batches = Object.values(output).map(
    ({ path }) => fg(`${dirname(path)}/*`).then(
      (files) => Promise.all(
        files.map(
          (file) => fs.readFile(file, 'utf-8').then<CacheEntry>(JSON.parse),
        ),
      ),
    ),
  );
  const pruned = [];
  for await (const batch of batches) {
    pruned.push(...(await applyStrategy(batch, vCache.strategy)));
  }
  if (pruned.length) {
    pruning.done().log(` ${pruned.length} caches`);
  }
};
