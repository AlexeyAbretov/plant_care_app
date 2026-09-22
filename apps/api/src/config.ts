import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnv = path.resolve(__dirname, '../../../.env');
const localEnv = path.resolve(__dirname, '../.env');

dotenv.config({ path: rootEnv, override: true });
dotenv.config({ path: localEnv, override: true });

function readEnv(name: string, fallback = ''): string {
  const raw = process.env[name]?.trim() ?? '';
  const value = raw.replace(/\s+#.*$/, '').trim();

  return value || fallback;
}

function readLlmProvider(): string {
  return readEnv('LLM_PROVIDER', 'ollama').toLowerCase();
}

function readTimeoutMs(): number {
  const parsed = Number(readEnv('LLM_TIMEOUT_MS', '120000'));

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 120_000;
  }

  return parsed;
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  mongodbUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/plant_care',
  llmProvider: readLlmProvider(),
  llmTimeoutMs: readTimeoutMs(),
  llmApiKey: readEnv('LLM_API_KEY'),
  llmModel: readEnv('LLM_MODEL'),
  llmBaseUrl: readEnv('LLM_BASE_URL').replace(/\/$/, ''),
  weatherDefaultCity: process.env.WEATHER_DEFAULT_CITY ?? 'Москва',
};
