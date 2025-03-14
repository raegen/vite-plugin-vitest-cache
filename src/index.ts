import type { Plugin } from 'vite';
import { InlineConfig } from 'vitest/node';
import { File } from '@vitest/runner';
import { here } from './util.js';
import { CacheOptions } from './options.js';

declare module 'vite' {
  export interface UserConfig {
    test?: InlineConfig;
  }
}

declare module 'vitest/runners' {
  export interface VitestTestRunner {
    onCollected(files: File[]): unknown;

    onAfterRunFiles(files: File[]): Promise<void>;
  }
}

const defaults = {
  dir: '.tests',
  states: ['pass'],
  silent: false,
};

export const vCache = (options?: CacheOptions): Plugin => ({
  name: 'vitest-cache',
  config: async () => ({
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

export type {
  CacheOptions,
};

export default vCache;
