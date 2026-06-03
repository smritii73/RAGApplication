import { ragGraph } from '../services/rag-graph.js';
import groqService from '../services/groq.service.js';

class ChatController {
  constructor() {
    this.conversationHistory = [];
  }

  async chat(req, res) {
    try {
      const { message, videoFilter } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message required' });
      }

      console.log(`\n[Chat] Message: ${message}`);

      // Add to history
      this.conversationHistory.push({ role: 'user', content: message });
      if (this.conversationHistory.length > 10) {
        this.conversationHistory = this.conversationHistory.slice(-10);
      }

      // Run LangGraph pipeline (retrieve → validate)
      console.log('[Chat] Running LangGraph pipeline...');
      const graphOutput = await ragGraph.invoke({
        question: message,
        conversationHistory: this.conversationHistory,
        videoFilter: videoFilter || null,
      });

      const retrievedChunks = graphOutput.context;
      console.log(`[Chat] LangGraph done. Got ${retrievedChunks.length} chunks`);

      // Build RAG prompt and stream via Groq
      const ragPrompt = groqService.buildRAGPrompt(
        retrievedChunks,
        message,
        this.conversationHistory
      );

      // Setup streaming headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const stream = await groqService.streamChat([
        ...this.conversationHistory.slice(0, -1),
        ragPrompt,
      ]);

      let fullResponse = '';

      stream.on('data', (chunk) => {
        const text = chunk.toString();
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices[0]?.delta?.content;
              if (content) {
                fullResponse += content;
                res.write(`data: ${JSON.stringify({ token: content })}\n`);
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      });

      stream.on('end', () => {
        this.conversationHistory.push({
          role: 'assistant',
          content: fullResponse,
        });
        res.write(`data: ${JSON.stringify({ sources: retrievedChunks, done: true })}\n`);
        res.end();
      });

      stream.on('error', (error) => {
        console.error('[Chat] Stream error:', error.message);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n`);
        res.end();
      });

    } catch (error) {
      console.error('[Chat] Controller error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  resetHistory(req, res) {
    this.conversationHistory = [];
    res.json({ status: 'conversation reset' });
  }
}

export default new ChatController();