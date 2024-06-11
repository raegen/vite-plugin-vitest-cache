/// <reference types="vitest" />

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveReporters } from './reporters.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const defaults = {
  outDir: '.tests',
  states: ['pass'],
};

const vitestCache = (options) => ({
  name: 'vitest-cache',
  config: async (config) => ({
    test: {
      caching: {
        ...defaults,
        ...options,
      },
      runner: path.resolve(__dirname, 'runner.ts'),
      globalSetup: path.resolve(__dirname, 'setup.ts'),
      reporters: await resolveReporters(config),
    },
  })
});

export default vitestCache;
