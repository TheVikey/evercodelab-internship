import express from 'express';
import type { Application } from 'express';

import config from './config';
import { setupStatusRoute } from './routes/RoutesStatus';
import { setupCurrenciesRoute } from './routes/RoutesCurrencies';
import { setupPriceRoute } from './routes/RoutesPrice';
import { setupWalletsRoute } from './routes/RoutesWallets';
import { setupBlockchainRoute } from './routes/RoutesBlockchain';
import { createAuthMiddleware } from './middleware/auth';
import { currencyStore } from './store/StoreCurrencies';
import { walletStore } from './store/StoreWallets';
import { blockchainStore } from './store/StoreBlockchain';
import type { PriceStore, PriceHistoryStore } from './types';

interface AppOptions {
    authToken?: string;
    priceStore?: PriceStore;
    priceHistoryStore?: PriceHistoryStore;
}

export function createApp(options: AppOptions = {}): Application {
    const app = express();
    app.use(express.json());

    setupStatusRoute(app);

    const authMiddleware = createAuthMiddleware(options.authToken || config.authToken);
    app.use(authMiddleware);

    setupCurrenciesRoute(app, currencyStore);
    setupPriceRoute(app, currencyStore, options.priceStore, options.priceHistoryStore);
    setupWalletsRoute(app, walletStore);
    setupBlockchainRoute(app, blockchainStore, walletStore);

    // Global error handler
    app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        const statusCode = (err as any).statusCode || 500;
        res.status(statusCode).json({
            error: err.message,
            timestamp: (err as any).timestamp || new Date().toISOString()
        });
    });

    return app;
}