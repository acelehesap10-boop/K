const client = require('prom-client');

// Default metrics
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

// Custom metric for orders processed
const ordersProcessed = new client.Counter({
  name: 'matching_engine_orders_processed_total',
  help: 'Total number of orders processed by the matching engine',
});

const orderProcessingTime = new client.Histogram({
  name: 'matching_engine_order_processing_seconds',
  help: 'Order processing times in seconds',
  buckets: [0.0005, 0.001, 0.002, 0.005, 0.01, 0.05, 0.1, 0.5],
});

function middlewareMetrics() {
  return (req, res, next) => {
    const end = orderProcessingTime.startTimer();
    res.on('finish', () => {
      ordersProcessed.inc();
      end();
    });
    next();
  };
}

function metricsEndpoint(app, path = '/metrics') {
  app.get(path, async (req, res) => {
    try {
      res.set('Content-Type', client.register.contentType);
      res.end(await client.register.metrics());
    } catch (err) {
      res.status(500).end(err);
    }
  });
}

module.exports = { middlewareMetrics, metricsEndpoint, ordersProcessed, orderProcessingTime };
