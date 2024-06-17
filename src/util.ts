import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = globalThis.__dirname || fileURLToPath(dirname(import.meta.url));

export const here = (path: string) => resolve(__dirname, path);

export const getInjectKey = <N extends string, K extends string>(namespace: N, key: K): `vitest-cache:${N}:${K}` => `vitest-cache:${namespace}:${key}`;
