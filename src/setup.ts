import fg from 'fast-glob';
import path from 'node:path';
import { build } from 'vite';
import type { GlobalSetupContext } from 'vitest/node';

export default async function setup({ config }: GlobalSetupContext) {
  const pattern = config.include.map((pattern) => path.resolve(process.cwd(), pattern));
  const files = await fg(pattern);

  await build({
    configFile: path.resolve(__dirname, 'tests.vite.config.ts'),
    build: {
      outDir: config.caching.dir,
      rollupOptions: {
        input: files,
      },
    },
    test: config,
  });
}
