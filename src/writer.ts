import fs from 'node:fs/promises';
import path from 'node:path';
import { Plugin } from 'vite';
import { PluginContext } from 'rollup';
import { CacheEntry } from './cache';

const getResults = async (file: string): Promise<CacheEntry> => fs.stat(file)
  .then(() => fs.readFile(file, {
    encoding: 'utf8',
  }))
  .then(JSON.parse)
  .catch(() => ({
    data: null,
  }));

export default (): Plugin => ({
  name: 'v-cache:writer',
  async generateBundle(this: PluginContext, { dir }, bundle) {
    for (const file in bundle) {
      const output = bundle[file];

      delete bundle[file];

      if (output.type !== 'chunk') {
        return;
      }

      const { isEntry, facadeModuleId, name, fileName: hash, viteMetadata } = output;

      if (isEntry) {
        const filePath = facadeModuleId.substring(facadeModuleId.indexOf(name));
        const fileName = path.join(filePath, hash);
        const resolved = path.resolve(dir, fileName);
        const { data } = await getResults(resolved);

        const { cost } = this.getModuleInfo(facadeModuleId).meta;

        this.emitFile({
          type: 'asset',
          fileName,
          name: facadeModuleId,
          source: JSON.stringify({
            data,
            path: resolved,
            cost,
            timestamp: Date.now(),
          }),
        });
      }
    }
  },
})
