import { TestProject } from 'vitest/node';
import { dirname } from 'node:path';
import fs from 'node:fs/promises';
import fg from 'fast-glob';
import { format, formatDim, version } from '../util.js';
import { applyStrategy } from '../strategy.js';
import { CacheEntry } from '../cache.js';
import { load } from '../load.js';

const createMeasurement = (action: string, silent?: boolean) => {
  const start = performance.now();
  return {
    done: () => {
      const duration = Math.round((performance.now() - start) / 10) / 100;
      return {
        log: (extra: string = '', flag = format('[vCache]')) => {
          if (!silent) {
            console.log(flag, formatDim(`${action}${extra} ${duration}s`));
          }
        },
      };
    },
  };
};

export default async ({ config, provide, vitest }: TestProject) => {
  if (!config.vCache.silent) {
    console.log(format('[vCache]'), formatDim(await version));
  }

  const files = await vitest.getRelevantTestSpecifications().then((specs) => specs.map((spec) => spec.moduleId));

  const building = createMeasurement('built hashes in', config.vCache.silent);
  const output = await load(files, config.vCache.dir);

  building.done().log();

  provide('v-cache:data', output);
  provide('v-cache:config', config.vCache);

  const counts = Object.values(output).reduce((acc, { data }) => {
    acc.total++;
    if (data) {
      acc.cache++;
    }

    return acc;
  }, {
    total: 0,
    cache: 0,
  });

  return async () => {
    if (!config.vCache.silent) {
      console.log(format('[vCache]'), formatDim(`${counts.cache}/${counts.total} files read from cache`));
    }
    const pruning = createMeasurement(`Pruned`, config.vCache.silent);
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
      pruned.push(...(await applyStrategy(batch, config.vCache.strategy)));
    }
    if (pruned.length) {
      pruning.done().log(` ${pruned.length} caches`);
    }
  };
};
