import dotenv from 'dotenv';
dotenv.config();  // MUST BE FIRST - before any other imports

import express from 'express';
import cors from 'cors';
import ingestRoutes from './routes/ingest.routes.js';
import chatRoutes from './routes/chat.routes.js';

// DEBUG: Log what was loaded
console.log('=== ENV DEBUG ===');
console.log('PYTHON_SCRAPER_URL:', process.env.PYTHON_SCRAPER_URL);
console.log('QDRANT_URL:', process.env.QDRANT_URL);
console.log('QDRANT_API_KEY exists:', !!process.env.QDRANT_API_KEY);
console.log('GROQ_API_KEY exists:', !!process.env.GROQ_API_KEY);
console.log('HF_API_KEY exists:', !!process.env.HF_API_KEY);
console.log('================');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/api/ingest', ingestRoutes);
app.use('/api/chat', chatRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});