import fs from 'node:fs/promises';
import * as path from 'node:path';

const root = path.resolve(process.cwd(), '.tests');

export const getResults = async (filePath: string) => {
  const file = path.resolve(root, filePath, 'meta.json');

  try {
    await fs.stat(file);
  } catch (e) {
    return {
      results: null,
      file,
    };
  }

  try {
    return JSON.parse(
      await fs.readFile(file, {
        encoding: 'utf8',
      }),
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return {
      results: null,
      file,
    };
  }
};

export const writeResults = async (path: string, results: any) => {
  const { file } = await getResults(path);

  await fs.writeFile(file, JSON.stringify({ file, results }, null, 2), {
    encoding: 'utf-8',
  });
};
