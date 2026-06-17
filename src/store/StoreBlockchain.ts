import { getDatabase } from '../db/database';
import { BlockchainRepository } from '../repositories/BlockchainRepository';
import type { BlockchainStore, BlockHeight } from '../types';

let repository: BlockchainRepository | null = null;

function getRepository(): BlockchainRepository {
  if (!repository) {
    const db = getDatabase();
    repository = new BlockchainRepository(db);
  }
  return repository;
}

export const blockchainStore: BlockchainStore = {
  getBlockHeight(blockchain: string): BlockHeight | undefined {
    return getRepository().getBlockHeight(blockchain);
  },

  updateBlockHeight(blockchain: string, height: number): BlockHeight {
    return getRepository().updateBlockHeight(blockchain, height);
  },

  reset(): void {
    getRepository().reset();
  }
};