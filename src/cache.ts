import fs from 'node:fs/promises';
import { deserialize, serialize, SerializedRecord } from '@ungap/structured-clone';
import { inject } from 'vitest';

export interface CacheEntry {
  data: SerializedRecord;
  path: string;
  cost: number;
  timestamp: number;
}

declare module 'vitest' {
  export interface ProvidedContext {
    'v-cache': {
      [key: string]: CacheEntry;
    };
  }
}

export class TaskCache<T extends { cache?: boolean }> {
  store = inject('v-cache');

  constructor(flag?: (cache: T) => T & { cache: true }) {
    if (flag) {
      this.flag = flag;
    }
  }

  readonly flag = (cache: T) => {
    return Object.assign(cache, { cache: true });
  };

  cost(key: string) {
    const cache = this.store[key];
    if (!cache) {
      return null;
    }
    return Math.round(cache.cost);
  }

  restore(key: string) {
    const cache = this.store[key];

    if (!cache) {
      return null;
    }

    return cache.data ? this.flag(deserialize(cache.data)) : null;
  }

  async save(key: string, data: T) {
    const cache = this.store[key];

    if (!cache) {
      return null;
    }

    return fs.writeFile(cache.path, JSON.stringify({
      ...cache,
      data: serialize(data),
    }), {
      encoding: 'utf-8',
    });
  }

}
