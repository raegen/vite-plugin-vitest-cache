import { beforeEach, describe, expect, it } from 'vitest';
import { InlineConfig, startVitest } from 'vitest/node';
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { File, Suite, Task } from '@vitest/runner';

const isPass = (task: Task | Suite | File) => {
  if (task.type === 'suite') {
    return task.tasks.every(isPass);
  }

  return task.result.state === 'pass';
};

const isCached = async (path: string) => {
  try {
    await stat(resolve(path));
    return readdir(resolve(path)).then((files) => Promise.all(files.map((file) => readFile(resolve(path, file), 'utf-8').then(JSON.parse).then(({ data }) => !!data))).then((r) => r.some(Boolean)));
  } catch (e) {
    return false;
  }
};

const writeFileRecursive = async (path: string, data: string) => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, data);
};

const dir = '__test__/.cache2';

const run = async (config?: InlineConfig) => {
  const { vCache } = await import('../src/v2');
  return startVitest('test', undefined, {
    watch: false,
    include: ['__test__/tests/*.mock.ts'],
    reporters: [{}],
    ...config,
  }, {
    plugins: [vCache({
      dir,
      silent: false,
    }) as any],
  }).then((vitest) => vitest.close().then(() => vitest));
}

describe('v-cache', () => {
  beforeEach(async () => {
    if (await stat(resolve(dir)).catch(() => null)) {
      await rm(resolve(dir), { recursive: true });
    }
  });

  it('should cache passing tests', {
    timeout: 10000,
  }, async () => {
    await run();

    expect(await isCached(`${dir}/pass0.mock.ts`)).toBe(true);
    expect(await isCached(`${dir}/pass1.mock.ts`)).toBe(true);
    expect(await isCached(`${dir}/variable.mock.ts`)).toBe(true);
    expect(await isCached(`${dir}/fail0.mock.ts`)).toBe(false);
    expect(await isCached(`${dir}/fail1.mock.ts`)).toBe(false);
  });

  it('should restore cached tests from cache', async () => {
    let files = (await run()).state.getFiles();

    for (const file of files) {
      expect(file.result).not.toHaveProperty('duration', 0);
    }

    const reference = Object.fromEntries(files.map((file) => [file.filepath, file]));

    files = (await run()).state.getFiles();

    for (const file of files) {
      if (isPass(file)) {
        expect(file.result).toHaveProperty('startTime', reference[file.filepath].result.startTime);
        expect(file.result).toHaveProperty('duration', 0);
      } else {
        expect(file.result).not.toHaveProperty('startTime', reference[file.filepath].result.startTime);
        expect(file.result).not.toHaveProperty('duration', 0);
      }
    }
  });

  it('should rerun only the tests affected by change', async () => {
    const reference = Object.fromEntries((await run()).state.getFiles().map((file) => [file.filepath.match(/__test__.*$/)?.[0], file]));

    const timestamp = Date.now();
    await writeFileRecursive(resolve(`__test__/tests/deep/nested/dependency/variables/${timestamp}.ts`), `export default '${timestamp}';`);

    const files = Object.fromEntries((await run()).state.getFiles().flatMap((files) => files).map((file) => [file.filepath.match(/__test__.*$/)?.[0], file]));

    expect(files['__test__/tests/variable.mock.ts'].result).not.toHaveProperty('startTime', reference['__test__/tests/variable.mock.ts'].result.startTime);
    expect(files['__test__/tests/variable.mock.ts'].result).not.toHaveProperty('duration', 0);

    expect(files['__test__/tests/pass0.mock.ts'].result).toHaveProperty('startTime', reference['__test__/tests/pass0.mock.ts'].result.startTime);
    expect(files['__test__/tests/pass0.mock.ts'].result).toHaveProperty('duration', 0);

    expect(files['__test__/tests/pass1.mock.ts'].result).toHaveProperty('startTime', reference['__test__/tests/pass1.mock.ts'].result.startTime);
    expect(files['__test__/tests/pass1.mock.ts'].result).toHaveProperty('duration', 0);

    expect(files['__test__/tests/fail0.mock.ts'].result).not.toHaveProperty('startTime', reference['__test__/tests/fail0.mock.ts'].result.startTime);
    expect(files['__test__/tests/fail0.mock.ts'].result).not.toHaveProperty('duration', 0);

    expect(files['__test__/tests/fail1.mock.ts'].result).not.toHaveProperty('startTime', reference['__test__/tests/fail1.mock.ts'].result.startTime);
    expect(files['__test__/tests/fail1.mock.ts'].result).not.toHaveProperty('duration', 0);
  });
});
