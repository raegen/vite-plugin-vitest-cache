import { File, Task, updateTask, VitestRunner, VitestRunnerImportSource } from '@vitest/runner';
import { VitestTestRunner } from 'vitest/runners';
import { CacheEntry, TaskCache } from './cache.js';
import { format } from './util.js';
import { inject } from 'vitest';
import { CacheOptions } from './options.js';

declare module 'vitest' {
  export interface ProvidedContext {
    'v-cache:data': {
      [key: string]: CacheEntry;
    };
    'v-cache:config': Omit<CacheOptions, 'strategy'>;
  }
}

const flagCached = <T extends Task>(task: T) => {
  if (task.type === 'suite') {
    task.tasks.forEach(flagCached);
  }
  task.name = `\b\b${format(`⛁`)} ${task.name}`;
  task.result = {
    ...task.result,
    duration: 0,
  };

  return task;
};

class CachedRunner extends VitestTestRunner implements VitestRunner {
  private cache = new TaskCache<File>(inject('v-cache:data'));
  private options = inject('v-cache:config');

  shouldCache(task: Task): boolean {
    return this.options.states.includes(task.result.state);
  }

  async importFile(filepath: string, source: VitestRunnerImportSource) {
    if (this.cache.has(filepath)) {
      return null;
    }
    return super.importFile(filepath, source);
  }

  shouldLog() {
    return !this.options.silent;
  }

  async onBeforeRunFiles(files: File[]) {
    for (const file of files) {
      const cached = this.cache.restore(file.filepath);

      if (cached) {
        files.splice(files.indexOf(file), 1);

        if (this.shouldLog()) {
          flagCached(cached);
        }
        await this.onCollected([cached]);
        updateTask('suite-finished', cached, this);
      }
    }
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
