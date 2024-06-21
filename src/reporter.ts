import chalk from 'chalk';
import { File, Reporter, Vitest } from 'vitest';
import { getSuites, getTests } from '@vitest/runner/utils';

const COLOR = chalk.hex('#BE29EC');
const format = (...args: string[]) => COLOR(`[${['Vitest Cache', ...args].join(' ')}]`);


export default class CacheReporter implements Reporter {
  private logger: Vitest['logger'];

  onFinished(files?: File[]) {
    const cached = files.filter((file) => file.cache);
    const suites = cached.flatMap(getSuites);
    const tests = cached.flatMap(getTests);
    const duration = cached.reduce((acc, {
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
    this.logger.log(format(), chalk.dim(COLOR(`${suites.length} suites, ${tests.length} tests (a total ${seconds}s of runtime) restored from cache.`)));
  }
}
