const express = require('express');
const cors = require('cors');

const PORT = Number(process.env.PORT) || 6000;
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',').map((o) => o.trim()).filter(Boolean);

if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
  try {
    require('applicationinsights').setup().start();
    console.log('📈 Application Insights enabled');
  } catch (err) {
    console.warn('⚠️ Application Insights failed to start:', err.message);
  }
}

const products = [
  { id: 1, name: 'Apple', price: 1.5 },
  { id: 2, name: 'Banana', price: 1.0 },
];

const app = express();

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
}));

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/products', (req, res) => res.json(products));

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  res.status(err.status || 500).send(err.message);
});

app.listen(PORT, () => console.log(`✅ Product API running on port ${PORT}`));
