import chalk from 'chalk';
import { BuiltinReporterOptions, ReportersMap } from 'vitest/reporters';
import { UserConfig } from 'vite';
import { Reporter, Vitest } from 'vitest';
import { getInjectKey } from './util.js';

type ReporterWithOptions<Name extends string = string> = Name extends keyof BuiltinReporterOptions ? BuiltinReporterOptions[Name] extends never ? [Name, {}] : [Name, Partial<BuiltinReporterOptions[Name]>] : [Name, Record<string, unknown>];
type ReporterOption = Reporter | ReporterWithOptions;

const COLOR = chalk.hex('#BE29EC');
const format = (...args: string[]) => COLOR(`[${['read from cache', ...args].join(' ')}]`);

type Logger = Vitest['logger'];

type ArgsMap = (...args: any[]) => any[] | void | false | undefined;

const createLogger = (logger: Logger, map: ArgsMap): Logger => Object.assign<Logger, Pick<Logger, 'log'>>(Object.create(logger), {
  log: (...args) => logger.log.apply(logger, map(...args) || args),
});

interface ExtendedReporter extends Reporter {
  ctx: Vitest;
}

const extendReporter = (reporter: Reporter): Reporter => {
  const state = {
    current: null,
  };
  return Object.assign<Reporter, Reporter>(Object.create(reporter), {
    onInit(this: ExtendedReporter, ctx: Vitest) {
      this.ctx = Object.assign(ctx, { logger: createLogger(ctx.logger, (...args) => state.current?.cache && [...args, format()]) });

      return reporter.onInit(ctx);
    },
    onTaskUpdate(this: ExtendedReporter, packs) {
      for (const pack of packs) {
        const [, result] = pack;

        state.current = result;
        reporter.onTaskUpdate?.([pack]);
        state.current = null;
      }
    },
    async onFinished(this: ExtendedReporter, ...args) {
      const duration = this.ctx.getCoreWorkspaceProject().getProvidedContext()?.[getInjectKey('setup', 'duration')];
      this.ctx.logger = createLogger(this.ctx.logger, (...args) => {
        if (args.some((arg) => arg.match(/Duration/))) {
          return [...args, format((duration / 1e3).toLocaleString('en-US', {
            useGrouping: false,
            maximumFractionDigits: 2,
          }))];
        }
      });
      await reporter.onFinished?.(...args);
    },
  });
};

const loadCustomReporter = (name: string) => import(name).then((module) => module.default);

const loadReporter = (name: string) => {
  if (name in ReportersMap) {
    return Promise.resolve(ReportersMap[name]);
  }

  return loadCustomReporter(name);
};

const resolveReporter = async (reporter: ReporterOption) => {
  if (typeof reporter === 'string') {
    return loadReporter(reporter).then((Reporter) => new Reporter());
  }
  if (Array.isArray(reporter)) {
    return loadReporter(reporter[0]).then((Reporter) => new Reporter(reporter[1]));
  }

  return reporter;
};

const overrides = process.argv.map((arg) => arg.match(/--reporter=([^ ]+)/)?.[1]).filter(Boolean);

const resolveReportersConfig = async (config: UserConfig): Promise<Reporter[]> => {
  if (overrides.length) {
    return Promise.all(overrides.map(loadReporter));
  }
  const { reporters } = config.test;
  if (reporters && Array.isArray(reporters)) {
    return Promise.all(reporters.map(resolveReporter));
  }
  return [new ReportersMap.default()];
};

export const resolveReporters = async (config: UserConfig) => {
  const reporters = await resolveReportersConfig(config);

  return reporters.map(extendReporter);
};
