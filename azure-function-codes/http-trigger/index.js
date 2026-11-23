const inventory = require('../shared/inventoryClient');

// Manual reorder / stock update: GET ?item=apple&quantity=6  or  POST {"item":"apple","quantity":6}
module.exports = async function (context, req) {
  const source = req.method === 'POST' && req.body ? req.body : req.query;
  const item = source.item;
  const quantity = Number.parseInt(source.quantity, 10);

  if (!item || Number.isNaN(quantity)) {
    context.res = { status: 400, body: '❌ Missing or invalid parameters: item and quantity are required.' };
    return;
  }

  try {
    context.res = await inventory.updateStock(item, quantity);
  } catch (err) {
    context.log.error('Inventory API call failed:', err.message);
    context.res = { status: 502, body: `❌ Request failed: ${err.message}` };
  }
};
