import path from 'node:path';
import { Plugin } from 'vite';
import { getResults } from './results';

const getResultsPaths = (file: string, hash: string) => [
  path.join(file, hash, 'meta.json'),
  path.join(file, 'meta.json'),
];

export default (): Plugin => ({
  name: 'write-meta',
  async generateBundle({ dir }, bundle) {
    for (const file in bundle) {
      const output = bundle[file];

      delete bundle[file];

      if (output.type !== 'chunk') {
        return;
      }

      const { isEntry, facadeModuleId, fileName: hash } = output;

      const moduleId = `${facadeModuleId}`;

      if (isEntry) {
        const filePath = path.relative(process.cwd(), moduleId);
        const paths = getResultsPaths(filePath, hash);
        const results = await getResults(path.resolve(dir!, filePath, hash));

        for (const fileName of paths) {
          this.emitFile({
            type: 'asset',
            fileName,
            source: JSON.stringify(results),
          });
        }
      }
    }
  },
})
