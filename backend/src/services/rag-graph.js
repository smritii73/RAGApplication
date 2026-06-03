import { StateGraph, START, END } from "@langchain/langgraph";
import embeddingService from './embedding.service.js';
import simpleVectorStore from './simple-vector-store.js';

// Define state shape for the graph
const graphState = {
  question: {
    value: (x, y) => y ?? x,
    default: () => "",
  },
  context: {
    value: (x, y) => y ?? x,
    default: () => [],
  },
  conversationHistory: {
    value: (x, y) => y ?? x,
    default: () => [],
  },
  videoFilter: {
    value: (x, y) => y ?? x,
    default: () => null,
  },
};

// Node 1: Embed the question and retrieve relevant transcript chunks
async function retrieveNode(state) {
  console.log("[LangGraph] ▶ Retrieve node running...");
  const { question, videoFilter } = state;

  const questionEmbedding = await embeddingService.embedText(question);

  let chunks;
  if (videoFilter && (videoFilter === "A" || videoFilter === "B")) {
    chunks = await simpleVectorStore.searchSimilar(questionEmbedding, videoFilter, 5);
  } else {
    chunks = await simpleVectorStore.searchBothVideos(questionEmbedding, 8);
  }

  console.log(`[LangGraph] ▶ Retrieved ${chunks.length} chunks`);
  return { context: chunks };
}

// Node 2: Validate context exists
async function validateNode(state) {
  console.log("[LangGraph] ▶ Validate node running...");
  const { context } = state;

  if (!context || context.length === 0) {
    console.warn("[LangGraph] ⚠ No relevant context found in vector store");
  }

  return { context };
}

// Build graph: retrieve → validate → END
const workflow = new StateGraph({ channels: graphState })
  .addNode("retrieve", retrieveNode)
  .addNode("validate", validateNode)
  .addEdge(START, "retrieve")
  .addEdge("retrieve", "validate")
  .addEdge("validate", END);

export const ragGraph = workflow.compile();