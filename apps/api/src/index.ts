import cors from 'cors';
import express from 'express';

import { config } from './config.js';
import { connectDb } from './db.js';
import { healthRouter } from './routes/health.js';
import { plantsRouter } from './routes/plants.js';
import { weatherRouter } from './routes/weather.js';
import { activeLlmModel } from './services/llm.client.js';

async function main(): Promise<void> {
  await connectDb();

  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use('/api/health', healthRouter);
  app.use('/api/plants', plantsRouter);
  app.use('/api/weather', weatherRouter);

  app.listen(config.port, () => {
    console.log(`API: http://localhost:${config.port}`);
    console.log(`LLM: ${config.llmProvider} (${activeLlmModel()})`);
  });
}

main().catch((error: unknown) => {
  console.error('API: не удалось запустить сервер', error);
  process.exit(1);
});
