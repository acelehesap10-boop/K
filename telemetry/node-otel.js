const { NodeSDK } = require('@opentelemetry/sdk-node');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const process = require('process');

function initTracing(serviceName = 'k-service') {
  try {
    const exporter = new JaegerExporter({
      serviceName,
      endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
    });

    const sdk = new NodeSDK({
      traceExporter: exporter,
      instrumentations: [getNodeAutoInstrumentations()],
    });

    sdk
      .start()
      .then(() => console.log(`OpenTelemetry initialized for ${serviceName}`))
      .catch((err) => console.error('Error starting OpenTelemetry SDK', err));

    // graceful shutdown
    process.on('SIGTERM', () => sdk.shutdown());
    process.on('SIGINT', () => sdk.shutdown());
  } catch (err) {
    console.error('OpenTelemetry init error', err);
  }
}

module.exports = { initTracing };
