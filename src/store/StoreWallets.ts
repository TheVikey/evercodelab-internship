import { getDatabase } from '../db/database';
import { WalletRepository } from '../repositories/WalletRepository';
import type { WalletStore, Wallet, WalletInput } from '../types';

let repository: WalletRepository | null = null;

function getRepository(): WalletRepository {
  if (!repository) {
    const db = getDatabase();
    repository = new WalletRepository(db);
  }
  return repository;
}

export const walletStore: WalletStore = {
  getWallets(): Wallet[] {
    return getRepository().getAll();
  },

  getWalletById(id: number): Wallet | undefined {
    return getRepository().getById(id);
  },

  getWalletsByBlockchain(blockchain: string): Wallet[] {
    return getRepository().getByBlockchain(blockchain);
  },

  addWallet(data: WalletInput): Wallet {
    return getRepository().create(data);
  },

  updateWallet(id: number, data: Partial<WalletInput>): Wallet | null {
    return getRepository().update(id, data);
  },

  deleteWallet(id: number): boolean {
    return getRepository().delete(id);
  },

  reset(): void {
    getRepository().reset();
  },

  updateBalance(id: number, balance: string): Wallet | null {
    return getRepository().updateBalance(id, balance);
  }
};