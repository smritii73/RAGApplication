import embeddingService from "../services/embedding.service.js";
import simpleVectorStore from '../services/simple-vector-store.js';
import groqService from "../services/groq.service.js";

class ChatController {
  constructor() {
    this.conversationHistory = [];
  }

  async chat(req, res) {
    try {
      const { message, videoFilter } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message required" });
      }

      console.log(`\n[Chat] Message: ${message}`);

      // Add to history
      this.conversationHistory.push({
        role: "user",
        content: message,
      });

      // Keep only last 5 turns
      if (this.conversationHistory.length > 10) {
        this.conversationHistory = this.conversationHistory.slice(-10);
      }

      // Embed the question
      console.log("[Chat] Embedding question...");
      const questionEmbedding = await embeddingService.embedText(message);
      console.log("[Chat] ✅ Question embedded");

      // Search Qdrant
      console.log("[Chat] Searching Qdrant...");
      let retrievedChunks;
      if (videoFilter && (videoFilter === "A" || videoFilter === "B")) {
        retrievedChunks = await simpleVectorStore.searchSimilar(
          questionEmbedding,
          videoFilter,
          5,
        );
      } else {
        retrievedChunks = await simpleVectorStore.searchBothVideos(
          questionEmbedding,
          10,
        );
      }
      console.log(`[Chat] ✅ Found ${retrievedChunks.length} relevant chunks`);

      // Build RAG prompt
      const ragPrompt = groqService.buildRAGPrompt(
        retrievedChunks,
        message,
        this.conversationHistory,
      );
      console.log("[Chat] Built RAG prompt, calling Groq...");

      // Setup streaming response
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      try {
        // Stream response
        const stream = await groqService.getInstance().streamChat([
          ...this.conversationHistory.slice(0, -1),
          ragPrompt,
        ]);

        let fullResponse = "";
        let isStreaming = false;

        stream.on("data", (chunk) => {
          isStreaming = true;
          const text = chunk.toString();
          const lines = text.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
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

        stream.on("end", () => {
          console.log("[Chat] ✅ Stream ended");
          this.conversationHistory.push({
            role: "assistant",
            content: fullResponse,
          });

          res.write(
            `data: ${JSON.stringify({ sources: retrievedChunks, done: true })}\n`,
          );
          res.end();
        });

        stream.on("error", (error) => {
          console.error("[Chat] Stream error:", error.message);
          if (!isStreaming) {
            res.write(`data: ${JSON.stringify({ error: error.message })}\n`);
          }
          res.end();
        });
      } catch (streamError) {
        console.error("[Chat] Groq streaming error:", streamError.message);
        res.write(
          `data: ${JSON.stringify({ error: `Streaming failed: ${streamError.message}` })}\n`,
        );
        res.end();
      }
    } catch (error) {
      console.error("[Chat] Controller error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  resetHistory(req, res) {
    this.conversationHistory = [];
    res.json({ status: "conversation reset" });
  }
}

export default new ChatController();
