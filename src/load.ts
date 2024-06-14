import path from 'node:path';
import { OutputAsset, RollupOutput } from 'rollup';
import { build } from 'vite';
import { ResolvedConfig } from 'vitest';
import { CacheEntry } from './cache';

export const load = (files: string[], config: ResolvedConfig) => build({
  configFile: path.resolve(__dirname, 'tests.vite.config.ts'),
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
