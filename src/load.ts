import { OutputAsset, RollupOutput } from 'rollup';
import { build } from 'vite';
import { here } from './util.js';
import type { CacheEntry } from './cache.js';

const mapOutput = (output: RollupOutput['output']): {
  [k: string]: CacheEntry;
} =>
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

export const load = (files: string[], dir: string) => build({
  configFile: here('./tests.vite.config'),
  build: {
    outDir: dir,
    rollupOptions: {
      input: files,
    },
  },
}).then(({ output }: RollupOutput) => mapOutput(output))
