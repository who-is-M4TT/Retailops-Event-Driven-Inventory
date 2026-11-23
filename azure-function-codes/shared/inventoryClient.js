const http = require('http');
const https = require('https');

/**
 * Minimal client for inventory-api, configured via app settings:
 *   INVENTORY_API_URL  e.g. http://<vm-address>:5000
 *   INVENTORY_API_KEY  must match the API_KEY of inventory-api
 */
function request(method, path, body) {
  const base = process.env.INVENTORY_API_URL;
  const apiKey = process.env.INVENTORY_API_KEY;
  if (!base || !apiKey) {
    return Promise.reject(new Error('INVENTORY_API_URL and INVENTORY_API_KEY must be configured'));
  }

  const url = new URL(path, base);
  const payload = body === undefined ? null : JSON.stringify(body);
  const headers = { 'x-api-key': apiKey };
  if (payload) {
    headers['Content-Type'] = 'application/json';
    headers['Content-Length'] = Buffer.byteLength(payload);
  }

  const client = url.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const req = client.request(url, { method, headers, timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('timeout', () => req.destroy(new Error('Request to inventory-api timed out')));
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

module.exports = {
  getStock: () => request('GET', '/stock'),
  updateStock: (item, quantity) => request('POST', '/update', { item, quantity }),
};
