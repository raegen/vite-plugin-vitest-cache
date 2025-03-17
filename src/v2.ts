import { here } from './util.js';
import type { CacheOptions } from './options.js';
import type { Plugin } from 'vite';

const defaults = {
  dir: '.tests',
  states: ['pass'],
  silent: false,
};

export const vCache = (options?: CacheOptions): Plugin => ({
  name: 'vitest-cache',
  config: () => ({
    test: {
      vCache: {
        ...defaults,
        ...options,
      },
      runner: here('./runner'),
      globalSetup: here('./setup'),
    },
  }),
});
