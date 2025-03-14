import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import fs from 'node:fs/promises';
import * as vi from 'vitest/node'

const __dirname = globalThis.__dirname || fileURLToPath(dirname(import.meta.url));

export const here = (path: string) => resolve(__dirname, path);

export const format = chalk.hex('#BE29EC');
export const formatDim = chalk.dim.hex('#BE29EC');

export const version = fs.readFile(here('../package.json'), 'utf-8').then(JSON.parse).then(({ version }) => version);

export const vitestVersion = vi.version ? 'v3' : 'v2';

export const runner = here(`./${vitestVersion}/runner`);
export const globalSetup = here(`./${vitestVersion}/setup`);
