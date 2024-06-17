import chalk from 'chalk';
import { BuiltinReporterOptions, ReportersMap } from 'vitest/reporters';
import { UserConfig } from 'vite';
import { Reporter, Vitest } from 'vitest';

type ReporterWithOptions<Name extends string = string> = Name extends keyof BuiltinReporterOptions ? BuiltinReporterOptions[Name] extends never ? [Name, {}] : [Name, Partial<BuiltinReporterOptions[Name]>] : [Name, Record<string, unknown>];
type ReporterOption = Reporter | ReporterWithOptions;

const FLAG_COLOR = '#BE29EC';
const CACHE_FLAG = chalk.hex(FLAG_COLOR)('[read from cache]');

type Logger = Vitest['logger'];

interface SignedLogger extends Logger {
  signature: string[];

  sign(value: string[]): void;
}

const createLogger = (logger: Logger) => Object.assign<Logger, Partial<SignedLogger>>(Object.create(logger), {
  log(...args) {
    return logger.log(...args, ...this.signature);
  },
  signature: [],
  sign(value) {
    this.signature = value;
  },
});

const extendReporter = (reporter: Reporter): Reporter => {
  return Object.assign<Reporter, Reporter>(Object.create(reporter), {
    onInit(ctx: Vitest) {
      this.logger = ctx.logger = createLogger(ctx.logger);

      return reporter.onInit(ctx);
    },
    onTaskUpdate(packs) {
      for (const pack of packs) {
        const [, result] = pack;

        this.logger.sign(result.cache ? [CACHE_FLAG] : []);
        reporter.onTaskUpdate?.([pack]);
        this.logger.sign([]);
      }
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
