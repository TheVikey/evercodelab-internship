import type { Application, Request, Response, NextFunction } from 'express';
import { ValidationError } from '../errors/ValidationError';
import { NotFoundError } from '../errors/NotFoundError';
import type { CurrencyStore } from '../types';

export function setupCurrenciesRoute(app: Application, store: CurrencyStore): void {

    function parseId(id: string): number {
        if (!/^\d+$/.test(id)) {
            throw new ValidationError('Invalid ID format');
        }
        return parseInt(id, 10);
    }

    // GET /currencies
    app.get('/currencies', (_req: Request, res: Response) => {
        res.json(store.getCurrencies());
    });

    // GET /currencies/:id
    app.get('/currencies/:id', (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseId(req.params.id as string);
            if (isNaN(id)) {
                throw new ValidationError('Invalid currency ID');
            }

            const currency = store.getCurrencyById(id);
            if (!currency) {
                throw new NotFoundError('Currency not found');
            }
            res.json(currency);
        } catch (err) {
            next(err);
        }
    });

    // POST /currencies
    app.post('/currencies', (req: Request, res: Response, next: NextFunction) => {
        try {
            const { name, ticker } = req.body || {};
            if (!name || !ticker) {
                throw new ValidationError('Fields "name" and "ticker" are required');
            }

            const created = store.addCurrency({ name, ticker });
            res.status(201).json(created);
        } catch (err) {
            const error = err as Error;
            if (error.message && error.message.includes('UNIQUE constraint failed')) {
                return next(new ValidationError('Currency with this ticker already exists'));
            }
            next(err);
        }
    });

    // PUT /currencies/:id
    app.put('/currencies/:id', (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseId(req.params.id as string);
            if (isNaN(id)) {
                throw new ValidationError('Invalid currency ID');
            }

            const updated = store.updateCurrency(id, req.body);
            if (!updated) {
                throw new NotFoundError('Currency not found');
            }
            res.json(updated);
        } catch (err) {
            const error = err as Error;
            if (error.message && error.message.includes('UNIQUE constraint failed')) {
                return next(new ValidationError('Currency with this ticker already exists'));
            }
            next(err);
        }
    });

    // DELETE /currencies/:id
    app.delete('/currencies/:id', (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseId(req.params.id as string);
            if (isNaN(id)) {
                throw new ValidationError('Invalid currency ID');
            }

            const deleted = store.deleteCurrency(id);
            if (!deleted) {
                throw new NotFoundError('Currency not found');
            }
            res.status(204).send();
        } catch (err) {
            next(err);
        }
    });
}