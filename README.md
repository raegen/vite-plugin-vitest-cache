# vite-plugin-vitest-cache [![npm](https://img.shields.io/npm/v/@raegen/vite-plugin-vitest-cache)](https://www.npmjs.com/package/@raegen/vite-plugin-vitest-cache)

> [!NOTE]
> In vitest terms, the caching covers: transformation, setup, collection, running, environment and preparation of tests. All of those are skipped for cached entries.

Vitest cache provides test caching for [Vitest](https://github.com/vitest-dev/vitest). This vite plugin is useful for running non-trivial, complex, resource-intensive, or otherwise slow tests, as it enables running only the tests that are actually affected by code changes.

## How it Works

It uses the same toolkit used for building your sources to build the test files. Hashes of these files are then used for cache matching. When running the tests, only the test files without a cache-hit (test files affected by the latest code changes for example) are run, the rest are simply restored from cache.

## Installation

```sh
npm install --save-dev @raegen/vite-plugin-vitest-cache
```
```sh
yarn add --dev @raegen/vite-plugin-vitest-cache
```

## Usage

```ts
import { defineConfig } from "vitest";
import vitestCache from '@raegen/vite-plugin-vitest-cache';

export default defineConfig({
  plugins: [vitestCache()],
});
```

## Options

### dir

Control where the caches are saved.

`@default` ".tests" (relative to the project root)

```ts
vitestCache({ dir: ".tests" });
```

### states

Control which result states to cache. Possible values are "pass" and "fail".

`@default` ["pass"]

```ts
vitestCache({ states: ["pass"] });
```

```bash
 ✓ src/some/feature/A/A.spec.ts  (20 tests) [read from cache]
 ✓ src/some/feature/Abc/Abc.spec.ts  (11 tests) [read from cache]
 ✓ src/some/feature/Abcde/Abcde.spec.ts  (6 tests) [read from cache]
 ✓ src/some/feature/Abcdefg/Abcdefg.spec.ts  (9 tests) [read from cache]
 ✓ src/some/feature/A/A.spec.ts  (5 tests) [read from cache]
 ✓ src/some/feature/Abc/Abc.spec.ts  (9 tests) [read from cache]
 ✓ src/some/feature/Abcde/Abcde.spec.ts  (15 tests) [read from cache]
 ✓ src/some/feature/A/A.spec.ts  (5 tests) [read from cache]
 ✓ src/some/feature/Abc/Abc.spec.ts  (2 tests) [read from cache]
 ✓ src/some/feature/A/A.spec.ts  (10 tests) 5ms
 ✓ src/some/feature/Abc/Abc.spec.ts  (4 tests) 1060ms
 ✓ src/some/feature/Abcde/Abcde.spec.ts  (6 tests) 2050ms
 ✓ src/some/feature/A/A.spec.ts  (8 tests) [read from cache]
 ✓ src/some/feature/Abc/Abc.spec.ts  (7 tests) [read from cache]
 Test Files  14 passed (14)
      Tests  117 passed (117)
   Start at  01:51:34
   Duration  7.80s (transform 0ms, setup 4.60s, collect 0ms, tests 3.12s, environment 668ms, prepare 2.53s) [read from cache 5.56]
```

## Note

> [!CAUTION]
> The purpose of this plugin is not to promote what are ultimately bad test practices. Your unit tests should _NOT_ be non-trivial, complex, resource-intensive, or otherwise slow. If you find yourself in need of such tests, first and foremost evaluate whether unit testing is what you need and look into integration, E2E testing etc.
