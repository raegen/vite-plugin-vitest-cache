import chalk from 'chalk';
import { File } from '@vitest/runner';
import { getSuites, getTests } from '@vitest/runner/utils';

const COLOR = chalk.hex('#BE29EC');
const format = (...args: string[]) => COLOR(`[${['Vitest Cache', ...args].join(' ')}]`);

export const log = (files: File[]) => {
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
  const tasks = [];
  if (files.length > 1) {
    tasks.push(`${files.length} files`);
  }
  if (suites.length > 1) {
    tasks.push(`${suites.length} suites`);
  }
  if (tests.length > 1) {
    tasks.push(`${tests.length} tests`);
  }
  const time = `${seconds}s`;
  console.log(format(), chalk.dim(COLOR(`${tasks.join(', ')} (a total of ${time} of runtime) restored from cache.`)));
};
