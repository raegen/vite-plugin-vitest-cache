import { File, updateTask, VitestRunner } from '@vitest/runner';
import { ResolvedConfig, TaskResult, TaskState } from 'vitest';
import { VitestTestRunner } from 'vitest/runners';
import { TaskCache } from './cache.js';
import chalk from 'chalk';
import { getSuites, getTests } from '@vitest/runner/utils';

const COLOR = chalk.hex('#BE29EC');
const format = (...args: string[]) => COLOR(`[${['Vitest Cache', ...args].join(' ')}]`);

const log = (files: File[]) => {
  const suites = files.flatMap(getSuites);
  const tests = files.flatMap(getTests);
  const duration = files.reduce((acc, {
    setupDuration,
    prepareDuration,
    collectDuration,
    environmentLoad,
    result,
  }) => acc + setupDuration + +prepareDuration + collectDuration + environmentLoad + result.duration, 0);
  const seconds = (duration / 1e3).toLocaleString('en-US', {
    useGrouping: false,
    maximumFractionDigits: 2,
  });
  console.log(format(), chalk.dim(COLOR(`${files.length} files, ${suites.length} suites, ${tests.length} tests (a total of ${seconds}s of runtime) restored from cache.`)));
};

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
