from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST, Counter, Histogram, start_http_server
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.jaeger.thrift import JaegerExporter

app = Flask(__name__)

# CORS konfigürasyonu
cors_config = {
    "origins": [
        "http://localhost:3000",
        "http://localhost:5000",
        "http://localhost:5001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5000",
        "http://127.0.0.1:5001",
        "https://github.com",
        "https://github.dev",
        "*"
    ],
    "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
    "supports_credentials": True,
    "max_age": 86400
}

# Tüm rotalar için CORS'u etkinleştir
CORS(app, resources={r"/*": cors_config})

# OpenTelemetry init for Flask
trace.set_tracer_provider(TracerProvider())
jaeger_exporter = JaegerExporter(agent_host_name=os.getenv('JAEGER_HOST', 'localhost'), agent_port=int(os.getenv('JAEGER_PORT', 6831)))
trace.get_tracer_provider().add_span_processor(BatchSpanProcessor(jaeger_exporter))

# Start Prometheus metrics HTTP server on different port (incremental)
start_http_server(int(os.getenv('PROMETHEUS_PORT', 8000)))

# Metrics
orders_processed = Counter('orders_processed_total', 'Total orders processed')
order_processing_time = Histogram('order_processing_seconds', 'Order processing time')

@app.route('/')
def home():
    return jsonify({
        'message': 'Python Flask API çalışıyor!',
        'version': '1.0.0',
        'framework': 'Flask'
    })

@app.route('/api/python/health')
def health():
    return jsonify({
        'status': 'healthy',
        'framework': 'Flask',
        'python_version': '3.12.1'
    })

@app.route('/api/python/data', methods=['POST'])
def process_data():
    data = request.get_json()
    # Instrumentation: simple Prometheus counters
    orders_processed.inc()
    with order_processing_time.time():
        # If you had additional processing, it would go here
        processed = True

    return jsonify({
        'success': True,
        'received': data,
        'processed': True
    })

if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
