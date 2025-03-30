import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import fs from 'node:fs';
import { Task } from '@vitest/runner';

const __dirname = globalThis.__dirname || fileURLToPath(dirname(import.meta.url));

export const here = (path: string) => resolve(__dirname, path);

export const version = JSON.parse(fs.readFileSync(here('../package.json'), 'utf-8')).version;
export const name = 'vitest-cache';

export const format = chalk.hex('#BE29EC');
export const formatDim = chalk.dim.hex('#BE29EC');

export const createMeasurement = (action: string, silent?: boolean) => {
  const start = performance.now();
  return {
    done: () => {
      const duration = Math.round((performance.now() - start) / 10) / 100;
      return {
        log: (extra: string = '', flag = format('[vCache]')) => {
          if (!silent) {
            console.log(flag, formatDim(`${action}${extra} ${duration}s`));
          }
        },
      };
    },
  };
};

export const flagCache = <T extends Task>(task: T) => {
  if (task.type === 'suite') {
    task.tasks.forEach(flagCache);
  }
  task.name = `\b\b${format(`⛁`)} ${task.name}`;
  task.result = {
    ...task.result,
    duration: 0,
  };

  return task;
};
