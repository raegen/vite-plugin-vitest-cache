import { Custom, File, Suite, Task, TaskResultPack, Test, updateTask, VitestRunner } from '@vitest/runner';
import * as path from 'node:path';
import { VitestTestRunner } from 'vitest/runners';
import { getResults, writeResults } from './results';
import { CacheOptions } from './options';
import { ResolvedConfig, TaskResult } from 'vitest';

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

interface SerializedTask extends Omit<Suite, 'file' | 'suite' | 'projectName' | 'tasks' | 'type'> {
  tasks: SerializedTask[];
  type: Suite['type'] | Test['type'] | Custom['type'];
}

interface SerializableTask extends Omit<Suite, 'projectName' | 'tasks' | 'type'> {
  tasks?: SerializableTask[];
  type: Suite['type'] | Test['type'] | Custom['type'];
}

const serializeTask = ({ file, suite, tasks = [], result, ...rest }: SerializableTask): SerializedTask => ({
  ...rest,
  result: {
    ...result,
    cache: true,
  },
  tasks: tasks.map(serializeTask),
});

const updateTasks = (suite: File | Suite | Task, runner: VitestRunner) => {
  updateTask(suite, runner);

  if ('tasks' in suite && suite.tasks) {
    suite.tasks.forEach((task) => updateTasks({ ...task, file: suite as File, suite }, runner));
  }
};

class CachedRunner extends VitestTestRunner implements VitestRunner {
  private states: CacheOptions['states'];

  constructor(config: ResolvedConfig) {
    super(config);
    this.states = config.caching.states;
  }

  shouldCache(result: TaskResult): boolean {
    return this.states.includes(result.state);
  }
  async onBeforeCollect(paths: string[]) {
    const promises = Promise.all(
      paths.map(async (test, i) => {
        const file = path.relative(process.cwd(), test);
        const { results } = await getResults(file);

        if (results) {
          paths.splice(i, 1);
        }

        return results;
      }),
    ).then((files) => files.filter(Boolean));

    const files = await promises;
    files.forEach((results) => {
      updateTasks(results, this);
    });
    await this.onTaskUpdate?.(files.map((file): TaskResultPack => [file.id, file.result, {}]));
    this.onCollected?.(files);
  }

  async onAfterRunSuite(suite: Suite) {
    if (suite.filepath) {
      const file = path.relative(process.cwd(), suite.filepath);

      if (this.shouldCache(suite.result)) {
        await writeResults(file, serializeTask(suite));
      }
    }
    return super.onAfterRunSuite(suite);
  }
}

export default CachedRunner;
