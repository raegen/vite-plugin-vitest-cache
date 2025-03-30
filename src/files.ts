import { createVitest, ResolvedConfig } from 'vitest/node';

const convertToUserConfig = ({ shard, cache, ...config }: ResolvedConfig) => ({
  ...config,
  shard: shard ? `${shard.index}/${shard.count}` : undefined,
});

declare module 'vitest/node' {
  export interface Vitest {
    getTestFilepaths(): Promise<string[]>;
  }
}

export const getFiles = async (config: ResolvedConfig): Promise<string[]> => createVitest('test', convertToUserConfig(config)).then((vitest) => vitest.getTestFilepaths().finally(() => vitest.close()));
