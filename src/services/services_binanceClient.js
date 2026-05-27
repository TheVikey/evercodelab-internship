const https = require('https');

const agent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 10,
  maxFreeSockets: 5
});

function fetchBinancePrices(retries = 2, delay = 500) {
  return new Promise((resolve, reject) => {
    let data = '';
    
    const makeRequest = (attempt) => {
      const req = https.get(
        'https://api.binance.com/api/v3/ticker/price',
        { agent, timeout: 5000 },
        (res) => {
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            if (res.statusCode === 200) {
              try {
                resolve(JSON.parse(data));
              } catch (e) {
                reject(new Error('Invalid Binance API response'));
              }
            } else if (res.statusCode >= 500 && attempt > 0) {
              setTimeout(() => makeRequest(attempt - 1), delay);
            } else {
              reject(new Error(`Binance API returned status ${res.statusCode}`));
            }
          });
        }
      );

      req.on('socket', (socket) => {
        if (socket.connecting) {
          socket.setTimeout(3000, () => {
            req.destroy();
            if (attempt > 0) {
              setTimeout(() => makeRequest(attempt - 1), delay);
            } else {
              reject(new Error('Connection timeout'));
            }
          });
        }
      });

      req.on('error', (err) => {
        if (attempt > 0 && (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT')) {
          setTimeout(() => makeRequest(attempt - 1), delay);
        } else {
          reject(err);
        }
      });
    };

    makeRequest(retries);
  });
}

module.exports = { fetchBinancePrices };