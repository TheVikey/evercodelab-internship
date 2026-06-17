import type { Logger, BlockchainStore } from '../types';

interface BlockchainUpdaterDeps {
  logger: Logger;
  blockchainStore: BlockchainStore;
  getBlockHeight: () => Promise<number>;
}

export function createBlockchainUpdater(deps: BlockchainUpdaterDeps) {
  const { logger, blockchainStore, getBlockHeight } = deps;

  async function updateBlockHeight(): Promise<{ blockchain: string; height: number }> {
    try {
      const height = await getBlockHeight();
      blockchainStore.updateBlockHeight('bsc', height);

      logger.info(`Updated BSC block height: ${height}`);

      return { blockchain: 'bsc', height };
    } catch (err) {
      logger.error(`Failed to update block height: ${(err as Error).message}`);
      throw err;
    }
  }

  return { updateBlockHeight };
}