# Video Content RAG Analyzer

## Overview

Video Content RAG Analyzer is a Retrieval-Augmented Generation (RAG) application that allows users to compare a YouTube video and an Instagram Reel, analyze their engagement metrics, and ask natural language questions about their content.
The system extracts transcripts and metadata from both videos, converts the content into embeddings, retrieves the most relevant transcript chunks for a user's query, and generates contextual responses using an LLM.
The primary goal of this project was to understand and implement the complete RAG pipeline, starting from content ingestion and transcript extraction to semantic retrieval and response generation.

---

## Features

* Compare a YouTube video and an Instagram Reel
* Extract transcripts and video metadata
* Generate embeddings for semantic search
* Perform retrieval using vector similarity
* Ask questions about video content using a chat interface
* Stream AI-generated responses in real time
* Compare engagement metrics between videos
* Maintain short conversational context across queries

---

## Tech Stack

### Frontend
* React
* Vite

### Backend
* Node.js
* Express

### AI & NLP
* Sentence Transformers (all-MiniLM-L6-v2)
* Groq (Llama 3.1 8B)

### Data Collection
* Python
* Flask
* yt-dlp

### Retrieval
* Vector embeddings
* Cosine similarity search

---

## System Flow

1. User submits a YouTube URL and an Instagram Reel URL.
2. The scraper service extracts metadata and transcript information.
3. Transcripts are divided into overlapping chunks.
4. Chunks are converted into embeddings using Sentence Transformers.
5. Embeddings are stored for retrieval.
6. When a question is asked, the query is embedded using the same model.
7. Relevant transcript chunks are retrieved through similarity search.
8. Retrieved context is passed to the LLM.
9. The generated answer is streamed back to the user.

---

## Design Decisions

### Initial Plan: Qdrant

The original architecture was designed around Qdrant as the vector database.
The reasoning was straightforward: RAG systems commonly rely on vector databases for efficient similarity search, metadata filtering, persistence, and scalability. Qdrant seemed like a natural choice for storing transcript embeddings and retrieving relevant chunks during question answering.
However, during implementation we realized that the actual scope of the project did not justify the overhead of running a dedicated vector database.
The application only compares two videos at a time, resulting in a relatively small number of transcript chunks. Retrieval was being performed over a very limited dataset, and the complexity introduced by Qdrant was providing little practical benefit.
After evaluating the requirements, we decided to simplify the architecture and move to a lightweight local vector storage approach with cosine similarity search.
This made development easier, reduced setup complexity, and allowed us to focus on the retrieval pipeline itself rather than infrastructure concerns.

### What We Would Do for a Larger System

If the project were expanded to support:

* Multiple users
* Large video collections
* Persistent storage
* Advanced filtering
* Production-scale retrieval

we would move back to a dedicated vector database such as Qdrant or ChromaDB.

In fact, ChromaDB would likely be the first upgrade because it provides persistence and vector search capabilities while remaining lightweight and developer-friendly.

---

## Challenges Faced

### Transcript Availability

Many videos do not expose captions consistently. In such situations, transcript extraction becomes unreliable and fallback strategies are required.

### Cross-Platform Data Differences

YouTube and Instagram expose different metadata structures and engagement signals. Normalizing this information required additional handling.

### Retrieval Accuracy

Selecting the correct chunk size and overlap required experimentation. Smaller chunks improved retrieval precision, while larger chunks preserved context better.

### Infrastructure Trade-offs

One of the key lessons from the project was understanding when a technology is genuinely needed.

Although vector databases are commonly used in RAG systems, using one for a small dataset introduced more complexity than value. Simplifying the architecture ultimately resulted in a cleaner implementation.

---

## Learning Outcomes

This project provided hands-on experience with:

* Retrieval-Augmented Generation (RAG)
* Embedding generation and vector search
* Semantic retrieval techniques
* Prompt construction for grounded responses
* Transcript extraction workflows
* Streaming LLM responses
* Trade-offs between simple and production-grade architectures

More importantly, it reinforced an important engineering lesson: choosing the right level of complexity is often more valuable than using the most sophisticated technology available.
