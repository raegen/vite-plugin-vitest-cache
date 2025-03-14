import type { Plugin } from 'vite';
import type { InlineConfig } from 'vitest/node';
import { File } from '@vitest/runner';
import { globalSetup, runner } from './util.js';
import type { CacheOptions } from './options.js';
import type { CacheEntry } from './cache.js';

declare module 'vite' {
  export interface UserConfig {
    test?: InlineConfig;
  }
}

declare module 'vitest' {
  export interface ProvidedContext {
    'v-cache:data': {
      [key: string]: CacheEntry;
    };
    'v-cache:config': Omit<CacheOptions, 'strategy'>;
  }
}

declare module 'vitest/runners' {
  export interface VitestTestRunner {
    onCollected(files: File[]): unknown;

    onAfterRunFiles(files: File[]): Promise<void>;
  }
}

declare module 'vitest/node' {
  export interface ResolvedConfig {
    vCache: CacheOptions;
  }
}

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
      runner,
      globalSetup,
    },
  }),
});

export type {
  CacheOptions,
};

export default vCache;
