# vite-plugin-vitest-cache [![npm](https://img.shields.io/npm/v/@raegen/vite-plugin-vitest-cache)](https://www.npmjs.com/package/@raegen/vite-plugin-vitest-cache) (vCache)

![vitest-cache-example](https://raw.githubusercontent.com/raegen/vite-plugin-vitest-cache/90c24c97adbad18f010a6918f6d3a94c8f444152/example.svg)


> [!NOTE]
> In vitest terms, the caching covers: transformation, setup, collection, running, environment and preparation of tests. All of those are skipped for cached entries in exchange for a small price of calculating the hashes.

vCache provides test caching for [Vitest](https://github.com/vitest-dev/vitest). This plugin is useful for:
- running non-trivial, complex, resource-intensive, or otherwise slow tests, as it enables running only the tests that are actually affected by code changes
- monorepos, as it avoids the complications and limitations stemming from complex package dependency trees by ignoring module boundaries and treating everything as sources, calculating hashes from tree shaken code.

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
import vCache from '@raegen/vite-plugin-vitest-cache';

export default defineConfig({
  plugins: [vCache()],
});
```

### Usage with CI

The only potential obstacle here, is cache persistence across runs, contexts. Since we use filesystem for cache storage, it's just a matter of configuring the respective CI cache to include the paths used by vCache (See [dir](https://github.com/raegen/vite-plugin-vitest-cache/edit/main/README.md#dir)).

#### Github Actions
```yaml
jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: vCache
      id: v-cache
      uses: actions/cache@v4
      with:
        path: **/.tests
        key: v-cache

    - name: Test
      run: ...run tests
```

#### Gitlab CI/CD
```yaml
job:
  script: ...run tests
  artifacts:
    name: v-cache
    paths:
      - **/.tests
```

## Options

### dir

Control where the caches are saved.

`@default` ".tests" (relative to the project root)

```ts
vCache({ dir: ".tests" });
```

### states

Control which result states to cache. Possible values are "pass" and "fail".

`@default` ["pass"]

```ts
vCache({ states: ["pass"] });
```

### silent

Control whether vCache should write any logs to stdout.

`@default` false

```ts
vCache({ silent: true });
```

### strategy

```ts
interface ExtendedCacheEntry {
  data: SerializedRecord;
  path: string;
  cost: number;
  timestamp: number;
  size: number;
}

interface CacheStrategy {
  (entries: ExtendedCacheEntry[]): ExtendedCacheEntry[];
}
```

Cache cleanup strategy. We can't have it grow forever, can we? Strategy is effectively a reducer for cache entries. It is invoked for each existing cache id (test file), with an array of currently stored cache entries (`entries: ExtendedCacheEntry[]`) for that id and should return an array of cache entries to be stored. (all the cache entries not present in the returned array are removed).

`@default` stores last 3 USED cached entries

```ts
vCache({
  strategy: (entries: ExtendedCacheEntry[]) => entries.sort((a, b) => b.timestamp - a.timestamp).slice(0, 3)
})
```


## Note

> [!CAUTION]
> The purpose of this plugin is not to promote what are ultimately bad test practices. Your unit tests should _NOT_ be non-trivial, complex, resource-intensive, or otherwise slow. If you find yourself in need of such tests, first and foremost evaluate whether unit testing is what you need and look into integration, E2E testing etc.
