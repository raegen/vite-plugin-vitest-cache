# vite-plugin-vitest-cache

Vitest cache provides test caching for [Vitest](https://github.com/vitest-dev/vitest). This vite plugin is useful for running non-trivial, complex, resource-heavy, or otherwise slow tests, as it enables running only the tests that are actually affected by code changes.

## How it Works

It uses the same toolkit used for building your sources to build the test files. Hashes of these files are then used for cache matching. When running the tests, only the test files without a cache-hit (test files affected by the latest code changes for example) are executed, the rest are simply restored from cache.

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

`@default` ".tests" (relative from the project root)

```ts
vitestCache({ dir: ".tests" });
```

### states

Control which result states to cache. Possible values are "pass" and "fail".

`@default` ["pass"]

```ts
vitestCache({ states: ["pass"] });
```
