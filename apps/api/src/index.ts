import cors from 'cors';
import express from 'express';

import { config } from './config.js';
import { connectDb } from './db.js';
import { healthRouter } from './routes/health.js';

async function main(): Promise<void> {
  await connectDb();

  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use('/api/health', healthRouter);

  app.listen(config.port, () => {
    console.log(`API: http://localhost:${config.port}`);
  });
}

main().catch((error: unknown) => {
  console.error('API: не удалось запустить сервер', error);
  process.exit(1);
});
