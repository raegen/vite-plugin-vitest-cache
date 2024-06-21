import type { Plugin } from 'vite';
import type { InlineConfig, TaskState } from 'vitest';
import { File } from '@vitest/runner';
import { here } from './util.js';

declare module 'vite' {
  export interface UserConfig {
    test?: InlineConfig;
  }
}

declare module 'vitest' {
  export interface ResolvedConfig {
    vCache: CacheOptions;
  }
}

declare module '@vitest/runner' {
  export interface TaskBase {
    cache?: boolean;
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
};

export interface CacheOptions {
  /* location for the caches, relative to the project root */
  dir?: string; // default: '.tests'
  /* default: ['pass'] - which task states (test outcomes) should be cached */
  states?: TaskState[]; // default: ['pass'] by default only passing tests are cached, failing tests are always rerun
}

export const vitestCache = (options?: CacheOptions): Plugin => ({
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

export default vitestCache;
