import path from 'node:path';
import { OutputAsset, RollupOutput } from 'rollup';
import { build } from 'vite';
import type { ResolvedConfig } from 'vitest';
import type { CacheEntry } from './cache';
import { here } from './util.js';

export const load = (files: string[], config: ResolvedConfig) => {
  const durations = new Map<string, number>();

  return build({
    configFile: here('./tests.vite.config'),
    build: {
      outDir: config.vCache.dir,
      rollupOptions: {
        input: files,
      },
    },
    plugins: [{
      name: 'vitest-cache:measure:start',
      enforce: 'pre',
      resolveId(id, _, { isEntry }) {
        if (isEntry) {
          durations.set(id, performance.now());
        }
      },
    }, {
      name: 'vitest-cache:measure:end',
      moduleParsed(module) {
        if (module.isEntry) {
          durations.set(module.id, performance.now() - durations.get(module.id));
        }
      },
    }],
  }).then(
    ({ output }: RollupOutput) =>
      output.map(({ fileName, name, source }: OutputAsset): [string, CacheEntry] => {
        const id = files.find((f) => f.endsWith(path.dirname(fileName)));
        return [
          id,
          {
            data: JSON.parse(`${source}`),
            path: name,
            duration: durations.get(id),
          },
        ];
      }),
  );
};
