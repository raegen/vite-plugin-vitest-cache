import chalk from 'chalk';
import { File } from '@vitest/runner';
import { getSuites, getTests } from '@vitest/runner/utils';

const format = chalk.hex('#BE29EC');

function createLog(...tokens: string[]) {
  const log = tokens.join(' ').trim();

  return [format(`[vCache]`), ' ', chalk.dim(format(log)), '\n'].join('');
}

export const logger = {
  log: (files: File[]) => {
    const suites = files.flatMap(getSuites);
    const tests = files.flatMap(getTests);

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
    if (!!tests.length) {
      process.stdout.write(createLog(tasks.join(', '), 'restored from cache.'));
    }
  },
};
