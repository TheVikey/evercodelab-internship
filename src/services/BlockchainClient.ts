import axios, { AxiosError } from 'axios';

const BSC_RPC_URL = 'https://bsc-dataseed.binance.org/';
const TIMEOUT_MS = 5000;

interface JsonRpcResponse<T> {
  jsonrpc: string;
  id: number;
  result: T;
  error?: {
    code: number;
    message: string;
  };
}

export async function getBlockHeight(retries: number = 2, delay: number = 500): Promise<number> {
  let lastError: Error | null = null;

  for (let attempt = retries; attempt >= 0; attempt--) {
    try {
      const response = await axios.post<JsonRpcResponse<string>>(
        BSC_RPC_URL,
        {
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1
        },
        {
          timeout: TIMEOUT_MS,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.data.error) {
        throw new Error(`RPC Error: ${response.data.error.message}`);
      }

      const height = parseInt(response.data.result, 16);
      return height;
    } catch (err) {
      const axiosErr = err as AxiosError;
      const isRetryable =
        axiosErr.code === 'ECONNRESET' ||
        axiosErr.code === 'ETIMEDOUT' ||
        axiosErr.code === 'ECONNABORTED' ||
        (axiosErr.response?.status && axiosErr.response.status >= 500);

      if (attempt > 0 && isRetryable) {
        await new Promise(resolve => setTimeout(resolve, delay));
        lastError = axiosErr;
        continue;
      }

      lastError = axiosErr;
    }
  }

  throw lastError || new Error('Failed to get block height');
}

export async function getBalance(address: string, retries: number = 2, delay: number = 500): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = retries; attempt >= 0; attempt--) {
    try {
      const response = await axios.post<JsonRpcResponse<string>>(
        BSC_RPC_URL,
        {
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [address, 'latest'],
          id: 1
        },
        {
          timeout: TIMEOUT_MS,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.data.error) {
        throw new Error(`RPC Error: ${response.data.error.message}`);
      }

      const balanceHex = response.data.result;
      const balanceWei = BigInt(balanceHex);
      
      const balanceBNB = Number(balanceWei) / 1e18;
      return balanceBNB.toFixed(8);
    } catch (err) {
      const axiosErr = err as AxiosError;
      const isRetryable =
        axiosErr.code === 'ECONNRESET' ||
        axiosErr.code === 'ETIMEDOUT' ||
        axiosErr.code === 'ECONNABORTED' ||
        (axiosErr.response?.status && axiosErr.response.status >= 500);

      if (attempt > 0 && isRetryable) {
        await new Promise(resolve => setTimeout(resolve, delay));
        lastError = axiosErr;
        continue;
      }

      lastError = axiosErr;
    }
  }

  throw lastError || new Error('Failed to get balance');
}