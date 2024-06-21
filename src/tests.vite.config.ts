import { builtinModules } from 'node:module';
import { createFilter, defineConfig, loadConfigFromFile } from 'vite';
import writer from './writer';

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
