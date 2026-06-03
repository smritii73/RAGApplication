import fs from 'fs';
import path from 'path';

const STORE_PATH = './vector_store.json';

class SimpleVectorStore {
  constructor() {
    this.collections = this.loadStore();
    this.collectionName = 'video-transcripts';
    console.log(`[VectorStore] Initialized (local JSON storage)`);
  }

  loadStore() {
    try {
      if (fs.existsSync(STORE_PATH)) {
        return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
      }
    } catch (e) {
      console.warn('Could not load vector store');
    }
    return {};
  }

  saveStore() {
    fs.writeFileSync(STORE_PATH, JSON.stringify(this.collections, null, 2));
  }

  async createCollection() {
    if (!this.collections[this.collectionName]) {
      this.collections[this.collectionName] = [];
      this.saveStore();
    }
    console.log('✅ Collection ready (local JSON storage)');
  }

  async upsertChunks(chunks, videoId, videoMetadata) {
    if (!this.collections[this.collectionName]) {
      this.collections[this.collectionName] = [];
    }

    chunks.forEach((chunk, idx) => {
      this.collections[this.collectionName].push({
        id: `${videoId}-${idx}`,
        vector: chunk.vector,
        text: chunk.text,
        video_id: videoId,
        title: videoMetadata.title,
        channel: videoMetadata.channel,
        url: videoMetadata.url,
      });
    });

    this.saveStore();
    console.log(`✅ Upserted ${chunks.length} chunks for video ${videoId}`);
  }

  cosineSimilarity(a, b) {
    const dotProduct = a.reduce((sum, x, i) => sum + x * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, x) => sum + x * x, 0));
    const magB = Math.sqrt(b.reduce((sum, x) => sum + x * x, 0));
    return magA && magB ? dotProduct / (magA * magB) : 0;
  }

  async searchSimilar(queryVector, videoId = null, limit = 5) {
    let results = this.collections[this.collectionName] || [];

    if (videoId) {
      results = results.filter(r => r.video_id === videoId);
    }

    const scored = results.map(r => ({
      ...r,
      score: this.cosineSimilarity(queryVector, r.vector),
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ vector, ...rest }) => rest);
  }

  async searchBothVideos(queryVector, limit = 5) {
    const results = this.collections[this.collectionName] || [];

    const scored = results.map(r => ({
      ...r,
      score: this.cosineSimilarity(queryVector, r.vector),
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ vector, ...rest }) => rest);
  }
}

let instance = null;

export default {
  getInstance() {
    if (!instance) {
      instance = new SimpleVectorStore();
    }
    return instance;
  },
  createCollection() {
    return this.getInstance().createCollection();
  },
  upsertChunks(chunks, videoId, videoMetadata) {
    return this.getInstance().upsertChunks(chunks, videoId, videoMetadata);
  },
  searchSimilar(queryVector, videoId, limit) {
    return this.getInstance().searchSimilar(queryVector, videoId, limit);
  },
  searchBothVideos(queryVector, limit) {
    return this.getInstance().searchBothVideos(queryVector, limit);
  },
};