import { File, updateTask, VitestRunner } from '@vitest/runner';
import { ResolvedConfig, TaskResult, TaskState } from 'vitest';
import { VitestTestRunner } from 'vitest/runners';
import { TaskCache } from './cache.js';
import { logger } from './logger.js';

class CachedRunner extends VitestTestRunner implements VitestRunner {
  private states: TaskState[];
  private cache = new TaskCache<File>();
  private restored: File[] = [];

  constructor(config: ResolvedConfig) {
    super(config);
    this.states = config.vCache.states;
  }

  shouldCache(result: TaskResult): boolean {
    return this.states.includes(result.state);
  }

  async onBeforeCollect(paths: string[]) {
    for (const test of paths) {
      const cached = this.cache.restore(test);
      if (cached) {
        paths.splice(paths.indexOf(test), 1);

        updateTask(cached, this);

        this.restored.push(cached);
      }
    }

    this.onCollected?.(this.restored);
  }

  async onAfterRunFiles(files?: File[]) {
    for await (const file of files) {
      if (this.shouldCache(file.result)) {
        await this.cache.save(file.filepath, file);
      }
    }

    await super.onAfterRunFiles(files);

    if (!this.config.vCache.silent && this.restored.length) {
      logger.log(this.restored);
    }
  }
}

export default CachedRunner;
