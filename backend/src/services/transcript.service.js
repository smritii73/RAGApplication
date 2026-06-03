import axios from 'axios';

class TranscriptService {
  constructor() {
    this.scraperUrl = process.env.PYTHON_SCRAPER_URL;
    console.log(`[TranscriptService] Initialized with scraper URL: ${this.scraperUrl}`);
  }

  async getYouTubeTranscript(url, followerCount) {
    try {
      const fullUrl = `${this.scraperUrl}/scrape-youtube`;
      console.log(`[YouTube] Calling: ${fullUrl}`);
      console.log(`[YouTube] With payload:`, { url, follower_count: followerCount });

      const response = await axios.post(fullUrl, {
        url,
        follower_count: followerCount,
      }, {
        timeout: 30000,
      });

      console.log(`[YouTube] Success:`, response.data.status || 'OK');
      return response.data;
    } catch (error) {
      console.error(`[YouTube] Full error:`, error.message);
      console.error(`[YouTube] Error code:`, error.code);
      
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Cannot connect to Python scraper at ${this.scraperUrl}. Is it running on port 5000?`);
      }
      if (error.response) {
        throw new Error(`Python scraper error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`YouTube scraping failed: ${error.message}`);
    }
  }

  async getInstagramTranscript(url, followerCount, comments, likes) {
    try {
      const fullUrl = `${this.scraperUrl}/scrape-instagram`;
      console.log(`[Instagram] Calling: ${fullUrl}`);

      const response = await axios.post(fullUrl, {
        url,
        follower_count: followerCount,
        comments,
        likes,
      }, {
        timeout: 30000,
      });

      console.log(`[Instagram] Success:`, response.data.status || 'OK');
      return response.data;
    } catch (error) {
      console.error(`[Instagram] Full error:`, error.message);
      console.error(`[Instagram] Error code:`, error.code);
      
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Cannot connect to Python scraper at ${this.scraperUrl}. Is it running on port 5000?`);
      }
      if (error.response) {
        throw new Error(`Python scraper error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`Instagram scraping failed: ${error.message}`);
    }
  }
}

// Lazy initialization - create instance only when accessed, not when imported
let instance = null;

export default {
  getInstance() {
    if (!instance) {
      instance = new TranscriptService();
    }
    return instance;
  },
  // Make it work like before
  getYouTubeTranscript(url, followerCount) {
    return this.getInstance().getYouTubeTranscript(url, followerCount);
  },
  getInstagramTranscript(url, followerCount, comments, likes) {
    return this.getInstance().getInstagramTranscript(url, followerCount, comments, likes);
  },
};