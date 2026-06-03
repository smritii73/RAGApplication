from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer

app = Flask(__name__)

# Load the model once
print("⏳ Loading embedding model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("✅ Model loaded successfully")

@app.route('/embed', methods=['POST'])
def embed():
    try:
        data = request.json
        texts = data.get('texts', [])
        
        if not texts:
            return jsonify({"error": "texts required"}), 400
        
        print(f"⏳ Embedding {len(texts)} texts...")
        embeddings = model.encode(texts).tolist()
        print(f"✅ Done embedding")
        
        return jsonify({"embeddings": embeddings})
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 Starting Embedding Server (Local)")
    print("="*60)
    print("Running on http://localhost:5001")
    print("Press CTRL+C to stop\n")
    app.run(port=5001, debug=False)