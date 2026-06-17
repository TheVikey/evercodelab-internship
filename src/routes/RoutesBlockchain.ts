import type { Application, Request, Response, NextFunction } from 'express';
import { ValidationError } from '../errors/ValidationError';
import { NotFoundError } from '../errors/NotFoundError';
import type { BlockchainStore, WalletStore } from '../types';

const VALID_BLOCKCHAINS = ['bsc', 'eth', 'btc'];

export function setupBlockchainRoute(
    app: Application,
    blockchainStore: BlockchainStore,
    walletStore: WalletStore
): void {

    // GET /blockchain/height?blockchain=bsc
    app.get('/blockchain/height', (req: Request, res: Response, next: NextFunction) => {
        try {
            const blockchainParam = (req.query.blockchain as string) || 'bsc';
            const blockchain = blockchainParam.toLowerCase().trim();

            if (!VALID_BLOCKCHAINS.includes(blockchain)) {
                throw new ValidationError(
                    `Invalid blockchain. Supported: ${VALID_BLOCKCHAINS.join(', ')}`
                );
            }

            const data = blockchainStore.getBlockHeight(blockchain);

            if (!data) {
                throw new NotFoundError(
                    `Block height for "${blockchain}" not found yet. Background sync may not have run.`
                );
            }

            res.json(data);
        } catch (err) {
            next(err);
        }
    });

    // GET /wallets/:address/balance — читает из БД (фоновое обновление)
    app.get('/wallets/:address/balance', (req: Request, res: Response, next: NextFunction) => {
        try {
            const address = req.params.address as string;

            if (!address || address.trim() === '') {
                throw new ValidationError('Address parameter is required');
            }

            if (!/^0[xX][a-fA-F0-9]{40}$/.test(address)) {
                throw new ValidationError(
                    'Invalid address format. Expected EVM-compatible address (0x followed by 40 hex characters)'
                );
            }

            const wallets = walletStore.getWallets();
            const wallet = wallets.find(
                w => w.address.toLowerCase() === address.toLowerCase()
            );

            if (!wallet) {
                throw new NotFoundError(
                    `Wallet "${address}" not found. Add it via POST /wallets first.`
                );
            }

            if (!wallet.balance) {
                throw new NotFoundError(
                    `Balance for "${address}" not available yet. Background sync may not have run.`
                );
            }

            res.json({
                address: wallet.address,
                blockchain: wallet.blockchain,
                balance: wallet.balance,
                updated_at: wallet.balance_updated_at
            });
        } catch (err) {
            next(err);
        }
    });
}