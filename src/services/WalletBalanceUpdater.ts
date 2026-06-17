import type { Logger, WalletStore } from '../types';
import { getBalance } from './BlockchainClient';

interface WalletBalanceUpdaterDeps {
  logger: Logger;
  walletStore: WalletStore;
}

export function createWalletBalanceUpdater(deps: WalletBalanceUpdaterDeps) {
  const { logger, walletStore } = deps;

  async function updateBalances(): Promise<{ updated: number; failed: number }> {
    const wallets = walletStore.getWallets();

    if (wallets.length === 0) {
      logger.info('No wallets in DB, skipping balance update');
      return { updated: 0, failed: 0 };
    }

    let updated = 0;
    let failed = 0;

    for (const wallet of wallets) {
      // Пропускаем non-EVM адреса (BTC)
      if (wallet.blockchain !== 'bsc' && wallet.blockchain !== 'eth') {
        continue;
      }

      try {
        const balance = await getBalance(wallet.address);
        walletStore.updateBalance(wallet.id, balance);
        updated++;
      } catch (err) {
        logger.error(
          `Failed to update balance for wallet ${wallet.address}: ${(err as Error).message}`
        );
        failed++;
      }
    }

    logger.info(`Updated balances: ${updated} succeeded, ${failed} failed`);

    return { updated, failed };
  }

  return { updateBalances };
}