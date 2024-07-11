import { GlobalSetupContext } from 'vitest/node';
import { dirname, resolve } from 'node:path';
import fs from 'node:fs/promises';
import fg from 'fast-glob';
import { build } from 'vite';
import { format, formatDim, here, version } from './util.js';
import { OutputAsset, RollupOutput } from 'rollup';
import { applyStrategy } from './strategy.js';
import { CacheEntry } from './cache.js';

const mapOutput = (output: RollupOutput['output']) =>
  Object.fromEntries(
    output
      .filter(
        (entry): entry is OutputAsset => entry.type === 'asset',
      )
      .map(
        ({
           name,
           source,
         }) => [name, JSON.parse(`${source}`)],
      ),
  );

const createMeasurement = (action: string) => {
  const start = performance.now();
  return {
    done: () => {
      const duration = Math.round((performance.now() - start) / 10) / 100;
      return {
        log: (extra: string = '', flag = format('[vCache]')) => console.log(flag, formatDim(`${action}${extra} ${duration}s`)),
      };
    },
  };
};

export default async ({ config, provide }: GlobalSetupContext) => {
  console.log(format('[vCache]'), formatDim(await version));
  const include = config.include.map((pattern) => resolve(config.root, pattern));
  const files = await fg(include, { ignore: ['**/node_modules/**', resolve(config.root, config.vCache.dir, '**')] });

  const building = createMeasurement('built hashes in');
  const output = await build({
    configFile: here('./tests.vite.config'),
    build: {
      outDir: config.vCache.dir,
      rollupOptions: {
        input: files,
      },
    },
  }).then(({ output }: RollupOutput) => mapOutput(output));

  building.done().log();

  provide('v-cache', output);

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
    console.log(format('[vCache]'), formatDim(`${counts.cache}/${counts.total} files read from cache`));
    const pruning = createMeasurement(`Pruned`);
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
