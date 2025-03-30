import type { Plugin, UserConfig } from 'vite';
import { here, name } from './util.js';
import type { CacheOptions } from './options';

declare module 'vitest/node' {
  export interface PoolOptions {
    vCache: { config: UserConfig };
  }

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
  name,
  config: (config) => ({
    test: {
      vCache: {
        ...defaults,
        ...options,
      },
      pool: here('./pool'),
      poolOptions: {
        vCache: {
          config: {
            ...config,
            test: {
              ...config.test,
            },
          },
        },
      },
    },
  }),
});
