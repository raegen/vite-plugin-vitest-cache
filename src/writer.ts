import fs from 'node:fs/promises';
import path from 'node:path';
import { Plugin } from 'vite';

const getResults = async (file: string) => fs.stat(file)
  .then(() => fs.readFile(file, {
    encoding: 'utf8',
  }))
  .then(JSON.parse)
  .catch(() => null);

export default (): Plugin => ({
  name: 'vitest-cache:writer',
  async generateBundle({ dir }, bundle) {
    for (const file in bundle) {
      const output = bundle[file];

      delete bundle[file];

      if (output.type !== 'chunk') {
        return;
      }

      const { isEntry, facadeModuleId, name, fileName: hash } = output;

      if (isEntry) {
        const filePath = facadeModuleId.substring(facadeModuleId.indexOf(name));
        const fileName = path.join(filePath, hash);
        const resolved = path.resolve(dir, fileName);
        const results = await getResults(resolved);

        this.emitFile({
          type: 'asset',
          fileName,
          name: resolved,
          source: JSON.stringify(results),
        });
      }
    }
  },
})
