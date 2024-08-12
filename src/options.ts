import type { TaskState } from 'vitest';
import type { CacheStrategy } from './strategy.js';

export interface CacheOptions {
  /* location for the caches, relative to the project root */
  dir?: string; // default: '.tests'
  /* default: ['pass'] - which task states (test outcomes) should be cached */
  states?: TaskState[]; // default: ['pass'] by default only passing tests are cached, failing tests are always rerun
  silent?: boolean; // default: false - if true, vCache will not write anything to stdout
  strategy?: CacheStrategy;
}
