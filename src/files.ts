import { createVitest, ResolvedConfig } from 'vitest2/node';

const convertToUserConfig = ({ shard, cache, ...config }: ResolvedConfig) => ({
  ...config,
  shard: shard ? `${shard.index}/${shard.count}` : undefined,
});

export const getFiles = async (config: ResolvedConfig): Promise<string[]> => createVitest('test', convertToUserConfig(config)).then((vitest) => vitest.getTestFilepaths().finally(() => vitest.close()));
