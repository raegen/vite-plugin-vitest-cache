import { File, Suite, TaskResultPack, updateTask, VitestRunner } from '@vitest/runner';
import { getTasks } from '@vitest/runner/utils';
import { ResolvedConfig, TaskResult } from 'vitest';
import { VitestTestRunner } from 'vitest/runners';
import { TaskCache } from './cache';
import { CacheOptions } from './options';

declare module 'vitest' {
  export interface ResolvedConfig {
    caching: CacheOptions;
  }
}

declare module '@vitest/runner' {
  export interface TaskResult {
    cache?: boolean;
  }
}

declare module 'vitest/runners' {
  export interface VitestTestRunner {
    onCollected(files: File[]): unknown;

    onTaskUpdate?(task: TaskResultPack[]): Promise<void>;
  }
}

class CachedRunner extends VitestTestRunner implements VitestRunner {
  private states: CacheOptions['states'];
  private cache = new TaskCache();

  constructor(config: ResolvedConfig) {
    super(config);
    this.states = config.caching.states;
  }

  shouldCache(result: TaskResult): boolean {
    return this.states.includes(result.state);
  }

  async onBeforeCollect(paths: string[]) {
    const files = [];
    for await (const test of paths) {
      const results = this.cache.restore(test);

      if (results) {
        paths.splice(paths.indexOf(test), 1);

        for (const task of getTasks(results)) {
          updateTask(task, this);
        }

        files.push(results);
      }
    }

    this.onCollected?.(files);
  }

  async onAfterRunSuite(suite: Suite) {
    if (suite.filepath) {
      if (this.shouldCache(suite.result)) {
        await this.cache.save(suite);
      }
    }
    return super.onAfterRunSuite(suite);
  }
}

export default CachedRunner;
