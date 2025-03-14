import fs from 'node:fs/promises';
import { deserialize, serialize, SerializedRecord } from '@ungap/structured-clone';

export interface CacheEntry {
  data: SerializedRecord;
  path: string;
  cost: number;
  timestamp: number;
}

export class TaskCache<T> {
  constructor(readonly store: { [key: string]: CacheEntry }) {
  }

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

    return cache.data ? deserialize(cache.data) : null;
  }

  has(key: string) {
    return !!this.store[key]?.data;
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
