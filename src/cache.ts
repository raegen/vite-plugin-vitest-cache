import fs from 'node:fs/promises';
import { inject } from 'vitest';
import { getInjectKey } from './util.js';
import { deserialize, serialize, SerializedRecord } from '@ungap/structured-clone';

export interface CacheEntry {
  data: SerializedRecord;
  path: string;
  duration: number;
}

declare module 'vitest' {
  export interface ProvidedContext {
    'vitest-cache:setup:duration': number;

    [key: `vitest-cache:key:${string}`]: CacheEntry;
  }
}

export class TaskCache<T extends { cache?: boolean }> {
  constructor(flag?: (cache: T) => T & { cache: true }) {
    if (flag) {
      this.flag = flag;
    }
  }

  readonly flag = (cache: T) => {
    return Object.assign(cache, { cache: true });
  };

  cost(key: string) {
    const cache = inject(getInjectKey('key', key));
    if (!cache) {
      return null;
    }
    return Math.round(cache.duration);
  }

  restore(key: string) {
    const cache = inject(getInjectKey('key', key));

    if (!cache) {
      return null;
    }

    return cache.data ? this.flag(deserialize(cache.data)) : null;
  }

  save(key: string, data: T) {
    const cache = inject(getInjectKey('key', key));

    if (!cache) {
      return null;
    }

    return fs.writeFile(cache.path, JSON.stringify(serialize(data)), {
      encoding: 'utf-8',
    });
  }
}
