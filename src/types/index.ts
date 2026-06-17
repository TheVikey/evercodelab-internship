import type { Request, Response, NextFunction } from 'express';

// Logger
export type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE';

export interface LoggerContext {
  requestId?: string;
}

export interface Logger {
  error: (message: string) => void;
  warn: (message: string) => void;
  info: (message: string) => void;
  debug: (message: string) => void;
  trace: (message: string) => void;
}

// Config
export interface AppConfig {
  appName: string;
  port: number;
  authToken: string;
}

// Currency
export interface Currency {
  id: number;
  name: string;
  ticker: string;
}

export interface CurrencyInput {
  name: string;
  ticker: string;
}

// Price
export interface Price {
  symbol: string;
  price: string;
  updated_at: string;
}

export interface BinancePriceResponse {
  symbol: string;
  price: string;
}

// Wallet
export interface Wallet {
    id: number;
    address: string;
    blockchain: string;
    label?: string;
    balance?: string;
    balance_updated_at?: string;
}

export interface WalletInput {
    address: string;
    blockchain: string;
    label?: string;
}

// Blockchain
export interface BlockHeight {
    blockchain: string;
    height: number;
    updated_at: string;
}

export interface WalletBalance {
    address: string;
    blockchain: string;
    balance: string;
    updated_at: string;
}

export interface PriceHistory {
    symbol: string;
    price: string;
    interval: string;
    timestamp: number;
}

export interface BinanceKline {
    openTime: number;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
    closeTime: number;
}

// Scheduler
export type TaskFunction = () => void | Promise<void>;

export interface Scheduler {
  scheduleTask: (name: string, interval: number, task: TaskFunction) => NodeJS.Timeout;
  stopAll: () => void;
}

// Price Updater
export interface PriceUpdaterResult {
  updated: number;
  tickers: string[];
}

export interface PriceUpdaterDeps {
  logger: Logger;
  currencyStore: CurrencyStore;
  priceStore: PriceStore;
  fetchBinancePrices: () => Promise<BinancePriceResponse[]>;
}

// Store interfaces
export interface CurrencyStore {
  getCurrencies: () => Currency[];
  getCurrencyById: (id: number) => Currency | undefined;
  getCurrencyByTicker: (ticker: string) => Currency | undefined;
  addCurrency: (data: CurrencyInput) => Currency;
  updateCurrency: (id: number, data: Partial<CurrencyInput>) => Currency | null;
  deleteCurrency: (id: number) => boolean;
  reset: () => void;
}

export interface PriceStore {
  getAllPrices: () => Price[];
  getPricesByTicker: (ticker: string) => Price[];
  updatePrices: (prices: BinancePriceResponse[]) => number;
  clearPrices: () => void;
}
export interface WalletStore {
    getWallets: () => Wallet[];
    getWalletById: (id: number) => Wallet | undefined;
    getWalletsByBlockchain: (blockchain: string) => Wallet[];
    addWallet: (data: WalletInput) => Wallet;
    updateWallet: (id: number, data: Partial<WalletInput>) => Wallet | null;
    deleteWallet: (id: number) => boolean;
    reset: () => void;
    updateBalance: (id: number, balance: string) => Wallet | null;
}

export interface BlockchainStore {
    getBlockHeight: (blockchain: string) => BlockHeight | undefined;
    updateBlockHeight: (blockchain: string, height: number) => BlockHeight;
    reset: () => void;
}

export interface PriceHistoryStore {
    getPriceHistory: (symbol: string, interval: string, limit?: number) => PriceHistory[];
    updatePriceHistory: (histories: PriceHistory[]) => number;
    clear: () => void;
}

// Express types
export type RequestHandler = (req: Request, res: Response, next: NextFunction) => void;
export type ErrorRequestHandler = (err: Error, req: Request, res: Response, next: NextFunction) => void;