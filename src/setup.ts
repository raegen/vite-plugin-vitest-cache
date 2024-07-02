import { GlobalSetupContext } from 'vitest/node';
import { dirname, resolve } from 'node:path';
import fs from 'node:fs/promises';
import fg from 'fast-glob';
import { build } from 'vite';
import { format, formatDim, here } from './util.js';
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
        log: () => console.log(format('[vCache]'), formatDim(`${action} done in ${duration}s`)),
      };
    },
  };
};

export default async ({ config, provide }: GlobalSetupContext) => {
  const include = config.include.map((pattern) => resolve(config.root, pattern));
  const files = await fg(include, { ignore: ['**/node_modules/**', resolve(config.root, config.vCache.dir, '**')] });

  const building = createMeasurement('building hashes');
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

  return async () => {
    const pruning = createMeasurement('pruning caches');
    const batches = Object.values(output).map(
      ({ path }) => fg(`${dirname(path)}/*`).then(
        (files) => Promise.all(
          files.map(
            (file) => fs.readFile(file, 'utf-8').then<CacheEntry>(JSON.parse),
          ),
        ),
      ),
    );
    for await (const batch of batches) {
      await applyStrategy(batch, config.vCache.strategy);
    }
    pruning.done().log();
  };
};
