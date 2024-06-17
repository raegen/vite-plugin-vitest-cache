import fg from 'fast-glob';
import path from 'node:path';
import type { GlobalSetupContext } from 'vitest/node';
import { load } from './load.js';
import { getInjectKey } from './util.js';

export default async function setup({ config, provide }: GlobalSetupContext) {
  const pattern = config.include.map((pattern) => path.resolve(config.root, pattern));
  const files = await fg(pattern);

  const start = performance.mark('vitest-cache:start');
  await load(files, config).then((results) => {
    const end = performance.mark('vitest-cache:end');
    const measure = performance.measure('vitest-cache', start.name, end.name);

    provide(getInjectKey('setup', 'duration'), measure.duration);
    results.forEach(([key, value]) => provide(getInjectKey('file', key), value));
  });
}
