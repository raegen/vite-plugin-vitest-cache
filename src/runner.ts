import { Suite, updateTask, VitestRunner } from '@vitest/runner';
import { getTasks } from '@vitest/runner/utils';
import { ResolvedConfig, TaskResult, TaskState } from 'vitest';
import { VitestTestRunner } from 'vitest/runners';
import { TaskCache } from './cache.js';

class CachedRunner extends VitestTestRunner implements VitestRunner {
  private states: TaskState[];
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
