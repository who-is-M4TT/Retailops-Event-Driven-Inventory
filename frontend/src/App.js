import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const PRODUCT_API = process.env.REACT_APP_PRODUCT_API_URL || 'http://localhost:6100';
const INVENTORY_API = process.env.REACT_APP_INVENTORY_API_URL || 'http://localhost:5000';
const API_KEY = process.env.REACT_APP_API_KEY || '';
const LOW_STOCK_THRESHOLD = 10;

const aiConnectionString = process.env.REACT_APP_APPINSIGHTS_CONNECTION_STRING;
if (aiConnectionString) {
  const appInsights = new ApplicationInsights({
    config: { connectionString: aiConnectionString, enableAutoRouteTracking: true },
  });
  appInsights.loadAppInsights();
  appInsights.trackPageView();
}

const App = () => {
  const [products, setProducts] = useState([]);
  const [stock, setStock] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(`${PRODUCT_API}/products`)
      .then((res) => setProducts(res.data))
      .catch((err) => { console.error('Error fetching products:', err); setError('Could not load products.'); });

    axios.get(`${INVENTORY_API}/stock`, { headers: { 'x-api-key': API_KEY } })
      .then((res) => setStock(res.data))
      .catch((err) => { console.error('Error fetching stock:', err); setError('Could not load stock.'); });
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>RetailOps Dashboard</h1>
      {error && <p style={{ color: '#b00020' }}>⚠️ {error}</p>}

      <h2>📦 Products</h2>
      <ul>
        {products.map((p) => (
          <li key={p.id}>{p.name} - ${p.price.toFixed(2)}</li>
        ))}
      </ul>

      <h2>📊 Stock</h2>
      <ul>
        {Object.entries(stock).map(([item, qty]) => (
          <li key={item} style={qty < LOW_STOCK_THRESHOLD ? { color: '#b00020', fontWeight: 600 } : undefined}>
            {item} - {qty} units{qty < LOW_STOCK_THRESHOLD ? ' (low - reorder queued)' : ''}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;
