const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { QueueClient } = require('@azure/storage-queue');

// ---- Configuration (all from environment) ----
const PORT = Number(process.env.PORT) || 5000;
const API_KEY = process.env.API_KEY;
const QUEUE_NAME = process.env.QUEUE_NAME || 'stock-events';
const LOW_STOCK_THRESHOLD = Number(process.env.LOW_STOCK_THRESHOLD) || 10;
const CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',').map((o) => o.trim()).filter(Boolean);

if (!API_KEY) {
  console.error('❌ API_KEY is not set. Refusing to start without authentication.');
  process.exit(1);
}

// ---- Optional telemetry (Application Insights, Node SDK) ----
if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
  try {
    require('applicationinsights').setup().start();
    console.log('📈 Application Insights enabled');
  } catch (err) {
    console.warn('⚠️ Application Insights failed to start:', err.message);
  }
}

// ---- Azure Storage Queue (optional: the API still works without it) ----
let queueClient = null;
if (CONNECTION_STRING) {
  queueClient = new QueueClient(CONNECTION_STRING, QUEUE_NAME);
  queueClient.createIfNotExists().catch((err) =>
    console.error('❌ Could not ensure queue exists:', err.message));
} else {
  console.warn('⚠️ AZURE_STORAGE_CONNECTION_STRING not set - low-stock events will not be queued.');
}

// ---- In-memory stock data ----
const stock = { apple: 30, banana: 20 };

const app = express();

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
}));
app.use(express.json());

// Public health probe (used by Docker healthcheck) - registered before auth
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// API key auth (constant-time comparison)
app.use((req, res, next) => {
  const provided = Buffer.from(String(req.headers['x-api-key'] || ''));
  const expected = Buffer.from(API_KEY);
  const valid = provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
  if (!valid) return res.status(401).send('Unauthorized: Invalid API key');
  next();
});

// Get current stock
app.get('/stock', (req, res) => res.json(stock));

// Update stock + enqueue a reorder event when low
app.post('/update', async (req, res) => {
  const { item, quantity } = req.body || {};

  if (!Object.prototype.hasOwnProperty.call(stock, item)) {
    return res.status(404).send('Item not found');
  }
  if (!Number.isInteger(quantity) || quantity < 0) {
    return res.status(400).send('quantity must be a non-negative integer');
  }

  stock[item] = quantity;

  if (quantity < LOW_STOCK_THRESHOLD && queueClient) {
    try {
      const message = Buffer.from(JSON.stringify({ item, quantity })).toString('base64');
      await queueClient.sendMessage(message);
      console.log(`⚠️ Low stock. Sent reorder message for ${item}`);
    } catch (err) {
      console.error('❌ Failed to send message to queue:', err.message);
    }
  }

  res.send(`Stock updated: ${item} = ${quantity}`);
});

// Error handler (e.g. CORS rejections, bad JSON)
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  res.status(err.status || 500).send(err.message);
});

app.listen(PORT, () => console.log(`✅ Inventory API running on port ${PORT}`));
