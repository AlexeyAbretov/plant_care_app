import { Router } from 'express';

import { checkLlmHealth } from '../services/llm.client.js';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({ status: 'ok' });
});

healthRouter.get('/llm', async (_req, res) => {
  const llm = await checkLlmHealth();

  res.json({ llm });
});
