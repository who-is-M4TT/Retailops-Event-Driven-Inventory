// Processes low-stock events published by inventory-api to the "stock-events" queue.
function parseMessage(raw) {
  if (typeof raw !== 'string') return raw; // runtime already deserialized JSON
  try {
    return JSON.parse(raw);
  } catch {
    return JSON.parse(Buffer.from(raw, 'base64').toString()); // base64-encoded JSON
  }
}

module.exports = async function (context, myQueueItem) {
  try {
    const data = parseMessage(myQueueItem);
    context.log(`📦 Processing reorder for ${data.item}`);
    context.log(`🔁 Quantity: ${data.quantity}`);
    context.log('✅ Reorder sent (simulated)');
  } catch (err) {
    context.log.error('❌ Error processing queue message:', err.message);
    throw err; // let the runtime retry / move to the poison queue
  }
};
