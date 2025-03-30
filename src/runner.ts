import { File, Task, updateTask, VitestRunner } from '@vitest/runner';
import { VitestTestRunner } from 'vitest/runners';
import { TaskCache } from './cache.js';
import { flagCache } from './util.js';
import { inject } from 'vitest';

declare module 'vitest/runners' {
  export interface VitestTestRunner {
    onCollected(files: File[]): unknown;

    onAfterRunFiles(files: File[]): Promise<void>;
  }
}

class CachedRunner extends VitestTestRunner implements VitestRunner {
  private cache = new TaskCache<File>(inject('v-cache:data'));
  private options = inject('v-cache:config');

  async provideCoverage(path: string) {
    try {
      await super.importFile(path, 'collect');
    } catch (e) {
    }
  }

  shouldCache(task: Task): boolean {
    return this.options.states.includes(task.result.state);
  }

  shouldLog() {
    return !this.options.silent;
  }

  async onBeforeCollect(paths: string[]) {
    const restored = [];
    for (const test of paths) {
      const cached = this.cache.restore(test);
      if (cached) {
        paths.splice(paths.indexOf(test), 1);
        if (this.shouldLog()) {
          flagCache(cached);
        }
        // @ts-ignore
        updateTask(cached, this);
        restored.push(cached);
      }
      if (this.config.coverage.enabled) {
        // coverage relies on runner imported sources
        await this.provideCoverage(test);
      }
    }
    this.onCollected?.(restored);
  }

  async onAfterRunFiles(files?: File[]) {
    for await (const file of files) {
      if (this.shouldCache(file)) {
        await this.cache.save(file.filepath, file);
      }
    }
    return super.onAfterRunFiles(files);
  }
}

export default CachedRunner;
