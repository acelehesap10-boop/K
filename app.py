from flask import Flask, jsonify, request
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

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
    return jsonify({
        'success': True,
        'received': data,
        'processed': True
    })

if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
