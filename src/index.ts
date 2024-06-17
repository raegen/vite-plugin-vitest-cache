/// <reference types="vitest" />

import { resolveReporters } from './reporters.js';
import { Plugin } from 'vite';
import { TaskState } from 'vitest';
import { File, TaskResultPack } from '@vitest/runner';
import { here } from './util.js';

declare module 'vitest' {
  export interface ResolvedConfig {
    caching: CacheOptions;
  }
}

declare module '@vitest/runner' {
  export interface TaskBase {
    originalDuration?: {
      setupDuration?: number;
      collectDuration?: number;
      prepareDuration?: number;
      environmentLoad?: number;
    };

  }

  export interface TaskResult {
    cache?: boolean;
    originalDuration?: number;
  }
}

declare module 'vitest/runners' {
  export interface VitestTestRunner {
    onCollected(files: File[]): unknown;

    onTaskUpdate?(task: TaskResultPack[]): Promise<void>;
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

export const vitestCache = (options: CacheOptions): Plugin => ({
  name: 'vitest-cache',
  config: async (config) => ({
    test: {
      caching: {
        ...defaults,
        ...options,
      },
      runner: here('./runner'),
      globalSetup: here('./setup'),
      reporters: await resolveReporters(config),
    },
  }),
});

export default vitestCache;
