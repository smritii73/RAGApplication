import transcriptService from "../services/transcript.service.js";
import embeddingService from "../services/embedding.service.js";
import engagementService from "../services/engagement.service.js";
import simpleVectorStore from "../services/simple-vector-store.js";
import { chunkText } from "../utils/chunking.js";

class IngestController {
  async ingestVideos(req, res) {
    try {
      const {
        youtubeUrl,
        instagramUrl,
        youtubeFollowers,
        instagramFollowers,
        instagramLikes,
        instagramComments,
      } = req.body;

      if (!youtubeUrl || !instagramUrl) {
        return res.status(400).json({
          error: "Both URLs required",
        });
      }

      // Create collection if missing
      await simpleVectorStore.createCollection();

      // IMPORTANT:
      // Clear previous session vectors
      await simpleVectorStore.clearCollection();

      console.log("🧹 Previous vectors cleared");

      console.log("📥 Scraping videos...");

      // ----------------------
      // YOUTUBE
      // ----------------------
      const youtubeData =
        await transcriptService.getYouTubeTranscript(
          youtubeUrl,
          youtubeFollowers || 0,
        );

      if (youtubeData.error) {
        return res.status(400).json({
          error: youtubeData.error,
        });
      }

      // ----------------------
      // INSTAGRAM
      // ----------------------
      const instagramData =
        await transcriptService.getInstagramTranscript(
          instagramUrl,
          instagramFollowers || 0,
          instagramComments || 100,
          instagramLikes || 5000,
        );

      if (instagramData.error) {
        return res.status(400).json({
          error: instagramData.error,
        });
      }

      console.log("📊 Computing engagement rates...");

      const engagementComparison =
        engagementService.compareVideos(
          youtubeData.metadata,
          instagramData.metadata,
        );

      console.log("✂️ Chunking transcripts...");

      const youtubeChunks =
        chunkText(youtubeData.transcript, 300, 50);

      const instagramChunks =
        chunkText(instagramData.transcript, 300, 50);

      console.log(
        `YouTube chunks: ${youtubeChunks.length}`,
      );

      console.log(
        `Instagram chunks: ${instagramChunks.length}`,
      );

      console.log("🧠 Generating embeddings...");

      const youtubeEmbeddings =
        await embeddingService.embedBatch(
          youtubeChunks,
        );

      const instagramEmbeddings =
        await embeddingService.embedBatch(
          instagramChunks,
        );

      const youtubeChunksWithVectors =
        youtubeChunks.map((text, idx) => ({
          text,
          vector: youtubeEmbeddings[idx],
          chunk_index: idx,
        }));

      const instagramChunksWithVectors =
        instagramChunks.map((text, idx) => ({
          text,
          vector: instagramEmbeddings[idx],
          chunk_index: idx,
        }));

      console.log("💾 Storing vectors...");

      await simpleVectorStore.upsertChunks(
        youtubeChunksWithVectors,
        "A",
        youtubeData.metadata,
      );

      await simpleVectorStore.upsertChunks(
        instagramChunksWithVectors,
        "B",
        instagramData.metadata,
      );

      console.log("✅ Ingestion complete");

      res.json({
        status: "success",

        videoA: {
          metadata: youtubeData.metadata,
          engagement: engagementComparison.videoA,
          chunksCount: youtubeChunks.length,
        },

        videoB: {
          metadata: instagramData.metadata,
          engagement: engagementComparison.videoB,
          chunksCount: instagramChunks.length,
        },

        comparison: engagementComparison,
      });
    } catch (error) {
      console.error("❌ Ingest error:", error);

      res.status(500).json({
        error: error.message,
      });
    }
  }
}

export default new IngestController();