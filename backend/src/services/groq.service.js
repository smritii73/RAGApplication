import fetch from 'node-fetch';

class GroqService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    this.model = 'llama-3.1-8b-instant';
    console.log(`[GroqService] Initialized with key: ${this.apiKey?.substring(0, 10)}...`);
  }

  async streamChat(messages) {
    try {
      console.log(`[Groq] Calling API with ${messages.length} messages...`);
      console.log(`[Groq] Auth header: Bearer ${this.apiKey?.substring(0, 10)}...`);
      
      const body = JSON.stringify({
        model: this.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: true,
      });

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: body,
      });

      console.log(`[Groq] Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Groq] Error response: ${errorText}`);
        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
      }

      console.log('[Groq] ✅ Stream started');
      return response.body;
    } catch (error) {
      console.error('[Groq] Full error:', error);
      throw new Error(`Groq streaming failed: ${error.message}`);
    }
  }

  buildRAGPrompt(retrievedChunks, userQuestion, conversationHistory) {
    const sourcesList = retrievedChunks
      .map((chunk, i) => `[${i + 1}] From "${chunk.title}" (Video ${chunk.video_id}): ${chunk.text.substring(0, 200)}...`)
      .join('\n\n');

    const history = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    return {
      role: 'user',
      content: `You are a helpful video content analyst. Answer questions based on the provided transcript chunks.

**VIDEO TRANSCRIPTS:**
${sourcesList}

**CONVERSATION HISTORY:**
${history || '(None yet)'}

**USER QUESTION:**
${userQuestion}

**INSTRUCTIONS:**
1. Answer based on the transcript chunks provided above
2. Cite which video (A or B) your information comes from
3. Be specific and reference actual quotes when possible
4. If information isn't in the chunks, say so clearly
5. Keep answers concise (2-3 sentences max)`,
    };
  }
}

// Lazy initialization
let instance = null;

export default {
  getInstance() {
    if (!instance) {
      instance = new GroqService();
    }
    return instance;
  },
  streamChat(messages) {
    return this.getInstance().streamChat(messages);
  },
  buildRAGPrompt(retrievedChunks, userQuestion, conversationHistory) {
    return this.getInstance().buildRAGPrompt(retrievedChunks, userQuestion, conversationHistory);
  },
};