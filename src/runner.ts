import { File, updateTask, VitestRunner } from '@vitest/runner';
import { ResolvedConfig, TaskResult, TaskState } from 'vitest';
import { VitestTestRunner } from 'vitest/runners';
import { TaskCache } from './cache.js';
import { log } from './logger.js';

class CachedRunner extends VitestTestRunner implements VitestRunner {
  private states: TaskState[];
  private cache = new TaskCache<File>();

  constructor(config: ResolvedConfig) {
    super(config);
    this.states = config.vCache.states;
  }

  shouldCache(result: TaskResult): boolean {
    return this.states.includes(result.state);
  }

  async onBeforeCollect(paths: string[]) {
    const files = [];
    for (const test of paths) {
      const cached = this.cache.restore(test);
      if (cached) {
        paths.splice(paths.indexOf(test), 1);

        updateTask(cached, this);

        files.push(cached);
      }
    }

    if (files.length) {
      log(files);
    }

    this.onCollected?.(files);
  }

  async onAfterRunFiles(files?: File[]) {
    for await (const file of files) {
      if (this.shouldCache(file.result)) {
        await this.cache.save(file.filepath, file);
      }
    }

    return super.onAfterRunFiles(files);
  }
}

export default CachedRunner;
