import type { InlineConfig } from 'vitest/node';
import * as vi from 'vitest/node';
import type { CacheOptions } from './options.js';
import { vCache as v2 } from './v2.js';
import { vCache as v3 } from './v3.js';

declare module 'vite' {
  export interface UserConfig {
    test?: InlineConfig;
  }
}

export const vCache = vi.version ? v3 : v2;

export type {
  CacheOptions,
};

export default vi.version ? v3 : v2;
