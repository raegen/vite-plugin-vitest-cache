import chalk from 'chalk';
import { ReportersMap } from 'vitest/reporters';

const FLAG_COLOR = '#BE29EC';
const CACHE_FLAG = chalk.hex(FLAG_COLOR)('[read from cache]');

const extendReporter = (Reporter) => {
  const state = {
    current: null,
  };
  return new (class extends Reporter {
    onInit(ctx) {
      const { logger } = ctx;
      const log = logger.log.bind(logger);

      logger.log = (...args) => {
        if (state.current?.cache) {
          return log(...args, CACHE_FLAG);
        }
        return log(...args);
      };

      return super.onInit(ctx);
    }

    onTaskUpdate(packs) {
      for (const pack of packs) {
        state.current = pack[1];
        super.onTaskUpdate([pack]);
        state.current = null;
      }
    }
  })();
};

const loadCustomReporter = (name) => import(name).then((module) => module.default);

export const resolveReporters = async (config) => {
  const maybeReporters = (process.argv.map((arg) => arg.match(/--reporter=([^ ]+)/)?.[1]) || config.test.reporters || []).filter(Boolean);
  const reporters = await Promise.all(maybeReporters.map(async (reporter) => reporter in ReportersMap ? ReportersMap[reporter] : await loadCustomReporter(reporter)));
  if (!reporters.length) {
    reporters.push(ReportersMap.default);
  }

  return reporters.map(extendReporter);
};
