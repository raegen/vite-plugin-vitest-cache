import path from 'node:path';
import { OutputAsset, PluginContext, RollupOutput } from 'rollup';
import { build } from 'vite';
import type { ResolvedConfig } from 'vitest';
import { here } from './util.js';

export const load = (files: string[], config: ResolvedConfig) => {
  const dir = path.resolve(config.vCache.dir);

  return build({
    configFile: here('./tests.vite.config'),
    build: {
      outDir: config.vCache.dir,
      rollupOptions: {
        input: files,
      },
    },
  }).then(({ output }: RollupOutput) => Object.fromEntries(output.filter((entry): entry is OutputAsset => entry.type === 'asset').map((cache) => [path.resolve(dir, path.dirname(cache.fileName)), JSON.parse(`${cache.source}`)])));
};
