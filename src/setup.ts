import fg from 'fast-glob';
import path from 'node:path';
import type { GlobalSetupContext } from 'vitest/node';
import { load } from './load.js';
import { format, formatDim, getInjectKey } from './util.js';

export default async function setup({ config, provide }: GlobalSetupContext) {
  const include = config.include.map((pattern) => path.resolve(config.root, pattern));
  const files = await fg(include, { ignore: ['**/node_modules/**', path.resolve(config.root, config.vCache.dir, '**')] });

  console.log(format('[vCache]'), formatDim('building hashes...'));
  await load(files, config).then((results) => {
    const duration = Math.round(results.reduce((acc, [key, value]) => acc + value.duration, 0) / 10) / 100;
    console.log(format('[vCache]'), formatDim(`hashes built in ${duration}s`));
    results.forEach(([key, value]) => provide(getInjectKey('key', key), value));
  });
}
