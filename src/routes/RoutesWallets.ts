import type { Application, Request, Response, NextFunction } from 'express';
import { ValidationError } from '../errors/ValidationError';
import { NotFoundError } from '../errors/NotFoundError';
import type { WalletStore } from '../types';

const VALID_BLOCKCHAINS = ['bsc', 'eth', 'btc'];

export function setupWalletsRoute(app: Application, store: WalletStore): void {

    function parseId(id: string): number {
        if (!/^\d+$/.test(id)) {
            throw new ValidationError('Invalid ID format');
        }
        return parseInt(id, 10);
    }

  // GET /wallets
  app.get('/wallets', (_req: Request, res: Response) => {
    res.json(store.getWallets());
  });

  // GET /wallets/:id
  app.get('/wallets/:id', (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseId(req.params.id as string);
      if (isNaN(id)) {
        throw new ValidationError('Invalid wallet ID');
      }

      const wallet = store.getWalletById(id);
      if (!wallet) {
        throw new NotFoundError('Wallet not found');
      }
      res.json(wallet);
    } catch (err) {
      next(err);
    }
  });

  // POST /wallets
  app.post('/wallets', (req: Request, res: Response, next: NextFunction) => {
    try {
      const { address, blockchain, label } = req.body || {};

      if (!address || !blockchain) {
        throw new ValidationError('Fields "address" and "blockchain" are required');
      }

      const normalizedBlockchain = blockchain.toLowerCase().trim();
      if (!VALID_BLOCKCHAINS.includes(normalizedBlockchain)) {
        throw new ValidationError(`Invalid blockchain. Supported: ${VALID_BLOCKCHAINS.join(', ')}`);
      }

      const created = store.addWallet({ address, blockchain: normalizedBlockchain, label });
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  // PUT /wallets/:id
  app.put('/wallets/:id', (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseId(req.params.id as string);
      if (isNaN(id)) {
        throw new ValidationError('Invalid wallet ID');
      }

      if (req.body.blockchain) {
        const normalizedBlockchain = req.body.blockchain.toLowerCase().trim();
        if (!VALID_BLOCKCHAINS.includes(normalizedBlockchain)) {
          throw new ValidationError(`Invalid blockchain. Supported: ${VALID_BLOCKCHAINS.join(', ')}`);
        }
        req.body.blockchain = normalizedBlockchain;
      }

      const updated = store.updateWallet(id, req.body);
      if (!updated) {
        throw new NotFoundError('Wallet not found');
      }
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  // DELETE /wallets/:id
  app.delete('/wallets/:id', (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseId(req.params.id as string);
      if (isNaN(id)) {
        throw new ValidationError('Invalid wallet ID');
      }

      const deleted = store.deleteWallet(id);
      if (!deleted) {
        throw new NotFoundError('Wallet not found');
      }
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });
}