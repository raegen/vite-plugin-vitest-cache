import fg from 'fast-glob';
import path from 'node:path';
import type { GlobalSetupContext } from 'vitest/node';
import { CacheEntry } from './cache';
import { load } from './load';

declare module 'vitest' {
  export interface ProvidedContext {
    [key: string]: CacheEntry;
  }
}

export default async function setup({ config, provide }: GlobalSetupContext) {
  const pattern = config.include.map((pattern) => path.resolve(config.root, pattern));
  const files = await fg(pattern);

  await load(files, config).then((results) => results.forEach(([key, value]) => provide(key, value)));
}
