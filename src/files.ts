import { createVitest, GlobalSetupContext } from 'vitest/node';

const convertToUserConfig = ({ shard, cache, ...config }: GlobalSetupContext['config']) => ({
  ...config,
  shard: shard ? `${shard.index}/${shard.count}` : undefined,
});

export const getFiles = async (config: GlobalSetupContext['config']): Promise<string[]> => createVitest('test', convertToUserConfig(config)).then((vitest) => vitest.getTestFilepaths().finally(() => vitest.close()));
