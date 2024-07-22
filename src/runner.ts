import { File, Task, updateTask, VitestRunner } from '@vitest/runner';
import { VitestTestRunner } from 'vitest/runners';
import { TaskCache } from './cache.js';
import { format } from './util.js';

class CachedRunner extends VitestTestRunner implements VitestRunner {
  private cache = new TaskCache<File>();

  shouldCache(task: Task): boolean {
    return this.config.vCache.states.includes(task.result.state);
  }

  shouldLog() {
    return !this.config.vCache.silent;
  }

  async onBeforeCollect(paths: string[]) {
    const restored = [];
    for (const test of paths) {
      const cached = this.cache.restore(test);
      if (cached) {
        paths.splice(paths.indexOf(test), 1);
        if (this.shouldLog()) {
          cached.name = `\b\b${format(`⛁`)} ${cached.name}`;
          cached.result.duration = 0;
        }
        updateTask(cached, this);
        restored.push(cached);
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
