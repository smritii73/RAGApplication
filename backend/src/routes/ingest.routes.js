import express from 'express';
import ingestController from '../controllers/ingest.controller.js';

const router = express.Router();

router.post('/', (req, res) => ingestController.ingestVideos(req, res));

export default router;