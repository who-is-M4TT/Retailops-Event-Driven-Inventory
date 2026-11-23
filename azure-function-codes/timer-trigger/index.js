const inventory = require('../shared/inventoryClient');

// Runs daily at 08:00 UTC (NCRONTAB: {sec} {min} {hour} {day} {month} {day-of-week})
module.exports = async function (context, myTimer) {
  context.log(`📅 Timer trigger started at ${new Date().toISOString()}`);

  try {
    const res = await inventory.getStock();
    if (res.status !== 200) throw new Error(`inventory-api responded ${res.status}`);

    const stock = JSON.parse(res.body);
    const lines = Object.entries(stock).map(([item, qty]) => `- ${item}: ${qty}`);
    context.log(`📦 Daily Stock Summary:\n${lines.join('\n')}`);
  } catch (err) {
    context.log.error('❌ Failed to fetch stock data:', err.message);
  }
};
