import { File, Suite, Task, updateTask, VitestRunner } from '@vitest/runner';
import { getTasks } from '@vitest/runner/utils';
import { ResolvedConfig, TaskResult, TaskState } from 'vitest';
import { VitestTestRunner } from 'vitest/runners';
import { TaskCache } from './cache.js';

const mapDuration = (task: File | Suite | Task) => {
  if (!task.result.originalDuration) {
    task.result.originalDuration = task.result.duration;
    task.result.duration = 0;
  }

  if (task.originalDuration) {
    return task;
  }

  task.originalDuration = {};
  if ('setupDuration' in task) {
    task.originalDuration.setupDuration = task.setupDuration;
    task.setupDuration = 0;
  }
  if ('collectDuration' in task) {
    task.originalDuration.collectDuration = task.collectDuration;
    task.collectDuration = 0;
  }
  if ('prepareDuration' in task) {
    task.originalDuration.prepareDuration = task.prepareDuration;
    task.prepareDuration = 0;
  }
  if ('environmentLoad' in task) {
    task.originalDuration.environmentLoad = task.environmentLoad;
    task.environmentLoad = 0;
  }

  return task;
};

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
    for (const test of paths) {
      const results = this.cache.restore(test);

      if (results) {
        paths.splice(paths.indexOf(test), 1);

        for (const task of getTasks(results)) {
          updateTask(mapDuration(task), this);
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
