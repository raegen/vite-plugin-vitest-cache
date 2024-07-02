import { builtinModules } from 'node:module';
import { createFilter, defineConfig, loadConfigFromFile } from 'vite';
import writer from './writer';
import { PluginContext } from 'rollup';

const isExternal = createFilter(['**/node_modules/**', '**/*.(svg|png|jpg|jpeg|s?css)']);

const userConfig = loadConfigFromFile(
  {
    command: 'build',
    mode: 'production',
  },
  undefined,
  process.cwd(),
);

const config = userConfig.then(async (config) =>
  defineConfig({
    plugins: [
      {
        name: 'v-cache:measure:start',
        enforce: 'pre',
        resolveId(id, _, { isEntry }) {
          if (isEntry) {
            return {
              id,
              meta: {
                start: performance.now(),
              },
            };
          }
        },
      }, {
        name: 'v-cache:measure:end',
        moduleParsed(this: PluginContext, module) {
          if (module.isEntry) {
            module.meta.end = performance.now();
            module.meta.cost = module.meta.end - module.meta.start;
          }
        },
      },
      writer(),
    ],
    publicDir: false,
    build: {
      outDir: '.tests',
      target: 'node20',
      sourcemap: false,
      minify: false,
      emptyOutDir: false,
      cssCodeSplit: false,
      rollupOptions: {
        treeshake: {
          preset: 'smallest',
          moduleSideEffects: true,
        },
        preserveEntrySignatures: 'strict',
        external: (source) => {
          return builtinModules.includes(source) || isExternal(source);
        },
        output: {
          format: 'module',
          preserveModules: true,
          chunkFileNames: '[hash:16]',
          assetFileNames: '[hash:16]',
          entryFileNames: '[hash:16]',
        },
        logLevel: 'silent',
      },
    },
    resolve: config?.config.resolve,
    logLevel: 'silent',
  }),
);

export default config;
