import { createVitest, ResolvedConfig, Vitest } from 'vitest/node';

const convertToUserConfig = ({ shard, cache, ...config }: ResolvedConfig) => ({
  ...config,
  shard: shard ? `${shard.index}/${shard.count}` : undefined,
});

interface Vitest2 extends Vitest {
  getTestFilepaths(): Promise<string[]>;
}

export const getFiles = async (config: ResolvedConfig): Promise<string[]> => createVitest('test', convertToUserConfig(config)).then((vitest: Vitest2) => vitest.getTestFilepaths().finally(() => vitest.close()));
