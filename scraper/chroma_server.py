import chromadb
import os

# Create data directory
os.makedirs("./chroma_data", exist_ok=True)

# Initialize with new API
client = chromadb.PersistentClient(path="./chroma_data")

if __name__ == "__main__":
    import uvicorn
    from chromadb.server.fastapi import app as chroma_app
    
    print("\n" + "="*60)
    print("🚀 Starting ChromaDB Server")
    print("="*60)
    print("Running on http://localhost:8000")
    print("Press CTRL+C to stop\n")
    
    uvicorn.run(chroma_app, host="127.0.0.1", port=8000)