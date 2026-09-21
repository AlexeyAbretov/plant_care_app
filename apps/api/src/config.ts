import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnv = path.resolve(__dirname, '../../../.env');
const localEnv = path.resolve(__dirname, '../.env');

dotenv.config({ path: rootEnv });
dotenv.config({ path: localEnv });

export const config = {
  port: Number(process.env.PORT ?? 3001),
  mongodbUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/plant_care',
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
  ollamaTimeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS ?? 120_000),
  weatherDefaultCity: process.env.WEATHER_DEFAULT_CITY ?? 'Москва',
};
