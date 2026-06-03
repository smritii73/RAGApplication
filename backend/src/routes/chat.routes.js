import express from 'express';
import chatController from '../controllers/chat.controller.js';

const router = express.Router();

router.post('/', (req, res) => chatController.chat(req, res));
router.post('/reset', (req, res) => chatController.resetHistory(req, res));

export default router;