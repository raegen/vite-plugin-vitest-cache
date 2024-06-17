import path from 'node:path';
import { OutputAsset, RollupOutput } from 'rollup';
import { build } from 'vite';
import { ResolvedConfig } from 'vitest';
import { CacheEntry } from './cache';
import { here } from './util.js';

export const load = (files: string[], config: ResolvedConfig) => build({
  configFile: here('./tests.vite.config'),
  build: {
    outDir: config.caching.dir,
    rollupOptions: {
      input: files,
    },
  },
  test: config,
}).then(
  ({ output }: RollupOutput) =>
    output.map(({ fileName, name, source }: OutputAsset): [string, CacheEntry] =>
      [
        files.find((f) => f.endsWith(path.dirname(fileName))),
        {
          data: JSON.parse(`${source}`),
          path: name,
        },
      ],
    ),
);
