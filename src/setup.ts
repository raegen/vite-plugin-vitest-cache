import { GlobalSetupContext } from 'vitest/node';
import { createMeasurement, format, formatDim, version } from './util.js';
import { CacheOptions } from './options.js';
import { load } from './load.js';
import { getFiles } from './files.js';
import { prune } from './prune.js';
import type { CacheEntry } from './cache';

declare module 'vitest/node' {
  export interface ResolvedConfig {
    vCache: CacheOptions;
  }
}

declare module 'vitest' {
  export interface ProvidedContext {
    'v-cache:data': {
      [key: string]: CacheEntry;
    };
    'v-cache:config': Omit<CacheOptions, 'strategy'>;
  }
}

export default async ({ config, provide }: GlobalSetupContext) => {
  if (!config.vCache.silent) {
    console.log(format('[vCache]'), formatDim(version));
  }

  const files = await getFiles(config);

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
    await prune(output, config);
  };
};
