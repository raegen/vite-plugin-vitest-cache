import { beforeAll, describe, expect, it } from 'vitest';
import { InlineConfig, startVitest } from 'vitest/node';
import vCache from '../src';
import fs from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const isCached = async (path: string) => {
  try {
    await fs.stat(resolve(path));
    return fs.readdir(resolve(path)).then((files) => Promise.all(files.map((file) => fs.readFile(resolve(path, file), 'utf-8').then(JSON.parse).then(({ data }) => !!data))).then((r) => r.some(Boolean)));
  } catch (e) {
    return false;
  }
};

const writeFileRecursive = async (path: string, data: string) => {
  await fs.mkdir(dirname(path), { recursive: true });
  await fs.writeFile(path, data);
};

const run = async (config?: InlineConfig) => startVitest('test', undefined, {
  watch: false,
}, {
  plugins: [vCache({
    dir: '__test__/.cache',
    silent: true,
  })],
  test: {
    include: ['__test__/tests/*.mock.ts'],
    reporters: [{}],
    ...config,
  },
}).then((vitest) => vitest.close().then(() => vitest));

describe('v-cache', () => {
  beforeAll(async () => {
    if (await fs.stat(resolve('__test__/.cache')).catch(() => null)) {
      await fs.rm(resolve('__test__/.cache'), { recursive: true });
    }
  });

  it('should cache passing tests', {
    timeout: 10000,
  }, async () => {
    await run();

    expect(await isCached('__test__/.cache/pass0.mock.ts')).toBe(true);
    expect(await isCached('__test__/.cache/pass1.mock.ts')).toBe(true);
    expect(await isCached('__test__/.cache/variable.mock.ts')).toBe(true);
    expect(await isCached('__test__/.cache/fail0.mock.ts')).toBe(false);
    expect(await isCached('__test__/.cache/fail1.mock.ts')).toBe(false);
  });

  it('should restore cached tests from cache', async () => {
    const vitest = await run();

    const files = [...vitest.state.filesMap.values()].flatMap((files) => files);

    for (const file of files) {
      if (file.result.state === 'pass') {
        expect(file).toHaveProperty('cache', true);
      } else {
        expect(file).not.toHaveProperty('cache');
      }
    }
  });

  it('should rerun only the tests affected by change', async () => {
    await run();

    const timestamp = Date.now();
    await writeFileRecursive(resolve(`__test__/tests/deep/nested/dependency/variables/${timestamp}.ts`), `export default '${timestamp}';`);

    const vitest = await run();

    const files = Object.fromEntries([...vitest.state.filesMap.values()].flatMap((files) => files).map((file) => [file.filepath.match(/__test__.*$/)?.[0], file]));

    expect(files['__test__/tests/variable.mock.ts']).not.toHaveProperty('cache');
    expect(files['__test__/tests/pass0.mock.ts']).toHaveProperty('cache', true);
    expect(files['__test__/tests/pass1.mock.ts']).toHaveProperty('cache', true);
    expect(files['__test__/tests/fail0.mock.ts']).not.toHaveProperty('cache');
    expect(files['__test__/tests/fail1.mock.ts']).not.toHaveProperty('cache');
  });
});
