import { Router } from 'express';

import { checkOllamaHealth } from '../services/ollama.client.js';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({ status: 'ok' });
});

healthRouter.get('/ollama', async (_req, res) => {
  const ollama = await checkOllamaHealth();

  res.json({ ollama });
});
