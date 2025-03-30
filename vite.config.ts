import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    watch: false,
    alias: [{
      find: /vitest\/node/,
      replacement: 'vitest/node',
      customResolver(_, importer) {
        if (importer.endsWith('__test__/v2.spec.ts') || importer.endsWith('src/files.ts')) {
          return this.resolve('vitest2/node');
        }
      },
    }],
  },
});
