import { Plugin } from 'vite';
import { CacheOptions } from './src/options';

declare const vitestCache: (options?: CacheOptions) => Plugin;

export default vitestCache;
