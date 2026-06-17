import axios, { AxiosError } from 'axios';
import type { BinancePriceResponse } from '../types';

const BINANCE_API_URL = 'https://api.binance.com/api/v3/ticker/price';
const TIMEOUT_MS = 5000;

export async function fetchBinancePrices(retries: number = 2, delay: number = 500): Promise<BinancePriceResponse[]> {
    let lastError: Error | null = null;

    for (let attempt = retries; attempt >= 0; attempt--) {
        try {
            const response = await axios.get<BinancePriceResponse[]>(BINANCE_API_URL, {
                timeout: TIMEOUT_MS,
                headers: { 'Accept': 'application/json' }
            });

            return response.data;
        } catch (err) {
            const axiosErr = err as AxiosError;
            const status = axiosErr.response?.status;

            const isRetryable =
                axiosErr.code === 'ECONNRESET' ||
                axiosErr.code === 'ETIMEDOUT' ||
                axiosErr.code === 'ECONNABORTED' ||
                (typeof status === 'number' && status >= 500);

            if (attempt > 0 && isRetryable) {
                await new Promise(resolve => setTimeout(resolve, delay));
                lastError = axiosErr;
                continue;
            }

            if (status && status < 500) {
                throw new Error(`Binance API returned status ${status}`);
            }

            lastError = axiosErr;
        }
    }

    throw lastError || new Error('Failed to fetch Binance prices');
}