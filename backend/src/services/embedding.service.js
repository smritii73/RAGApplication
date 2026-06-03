import axios from 'axios';

class EmbeddingService {
  constructor() {
    this.embeddingServiceUrl = process.env.EMBEDDING_SERVICE_URL;
    console.log(`[EmbeddingService] Using: ${this.embeddingServiceUrl}`);
  }

  async embedText(text) {
    try {
      const response = await axios.post(
        `${this.embeddingServiceUrl}/embed`,
        { texts: [text] },
        { timeout: 60000 }
      );
      return response.data.embeddings[0];
    } catch (error) {
      console.error('Embedding error:', error.message);
      throw new Error(`Embedding failed: ${error.message}`);
    }
  }

  async embedBatch(texts) {
    try {
      console.log(`[Embedding] Batch embedding ${texts.length} texts...`);
      const response = await axios.post(
        `${this.embeddingServiceUrl}/embed`,
        { texts },
        { timeout: 120000 }
      );
      console.log(`[Embedding] ✅ Done`);
      return response.data.embeddings;
    } catch (error) {
      console.error('Batch embedding error:', error.message);
      throw new Error(`Batch embedding failed: ${error.message}`);
    }
  }
}

// Lazy initialization
let instance = null;

export default {
  getInstance() {
    if (!instance) {
      instance = new EmbeddingService();
    }
    return instance;
  },
  embedText(text) {
    return this.getInstance().embedText(text);
  },
  embedBatch(texts) {
    return this.getInstance().embedBatch(texts);
  },
};