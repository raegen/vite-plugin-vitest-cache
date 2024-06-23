import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';

const __dirname = globalThis.__dirname || fileURLToPath(dirname(import.meta.url));

export const here = (path: string) => resolve(__dirname, path);

export const getInjectKey = <N extends string, K extends string>(namespace: N, key: K): `vitest-cache:${N}:${K}` => `vitest-cache:${namespace}:${key}`;

export const format = chalk.hex('#BE29EC');
export const formatDim = chalk.dim.hex('#BE29EC');
