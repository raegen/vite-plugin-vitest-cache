import { createMethodsRPC, createVitest, ProcessPool, TestModule, Vitest } from 'vitest/node';
import { getTasks } from '@vitest/runner/utils';
import { createMeasurement, flagCache, format, formatDim, version } from './util.js';
import { load } from './load.js';
import { TaskCache } from './cache.js';
import { File, Task } from '@vitest/runner';
import { prune } from './prune.js';

interface TestModuleWithTask extends TestModule {
  task?: File;
}

const createCtx = async (vitest: Vitest) => {
  const { config } = vitest;
  const { silent } = config.vCache;

  const options = config.poolOptions?.vCache as any;

  if (!silent) {
    console.log(format('[vCache]'), formatDim(version));
  }
  const building = createMeasurement('built hashes in', silent);

  const files = (await vitest.getRelevantTestSpecifications()).map(({ moduleId }) => moduleId);
  const output = await load(files, config.vCache.dir);

  building.done().log();

  const counts = Object.values(output).reduce((acc, { data }) => {
    acc.total++;
    if (data) {
      acc.cache++;
    }

    return acc;
  }, {
    total: 0,
    cache: 0,
  });

  const cache = new TaskCache<File>(output);

  return {
    cache,
    output,
    counts,
    vitest: await createVitest('test', {
      ...options?.config.test,
      pool: options?.config.test?.pool || null,
      reporters: [{}],
    }, {}),
  };
};

export default (vitest: Vitest): ProcessPool => {
  const { config } = vitest;
  const { silent } = config.vCache;
  const shouldCache = (task: Task) => config.vCache.states.includes(task.result.state);

  const ctx = createCtx(vitest);

  return {
    name: 'vCache',
    async collectTests() {
      throw new Error('Not implemented');
    },
    async runTests(specs) {
      if (!config.vCache) {
        throw new Error('vCache is not enabled');
      }

      const { cache, vitest } = await ctx;

      for (const { project, moduleId } of specs) {
        const methods = createMethodsRPC(project);
        const cached = cache.restore(moduleId);
        if (cached) {
          if (!silent) {
            flagCache(cached);
          }
          await methods.onCollected([cached]);
          await methods.onTaskUpdate(getTasks(cached).map(task => [
            task.id,
            task.result,
            task.meta,
          ]), []);
        } else {
          const specs = await vitest.getRelevantTestSpecifications([moduleId]);
          const results = await vitest.runTestSpecifications(specs);

          const files = results.testModules.map((module: TestModuleWithTask) => module.task).filter(({ filepath }) => filepath === moduleId);

          for await (const file of files) {
            await methods.onCollected([file]);
            await methods.onTaskUpdate(getTasks(file).map(task => [
              task.id,
              task.result,
              task.meta,
            ]), []);
            if (shouldCache(file)) {
              await cache.save(file.filepath, file);
            }
          }
        }
      }
    },
    async close() {
      const { output, counts, vitest } = await ctx;
      await vitest.close();
      if (!silent) {
        console.log(format('[vCache]'), formatDim(`${counts.cache}/${counts.total} files read from cache`));
      }
      await prune(output, config);
    },
  };
}
