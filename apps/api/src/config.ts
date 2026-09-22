import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnv = path.resolve(__dirname, '../../../.env');
const localEnv = path.resolve(__dirname, '../.env');

dotenv.config({ path: rootEnv, override: true });
dotenv.config({ path: localEnv, override: true });

export type LlmProvider = 'ollama' | 'openai';

function readEnv(name: string, fallback = ''): string {
  const raw = process.env[name]?.trim() ?? '';
  const value = raw.replace(/\s+#.*$/, '').trim();

  return value || fallback;
}

function readLlmProvider(): LlmProvider {
  const value = readEnv('LLM_PROVIDER', 'ollama').toLowerCase();

  if (value === 'openai') {
    return 'openai';
  }

  return 'ollama';
}

function readTimeoutMs(): number {
  const raw = readEnv('LLM_TIMEOUT_MS') || readEnv('OLLAMA_TIMEOUT_MS');
  const parsed = Number(raw || 120_000);

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
  ollamaBaseUrl: readEnv('OLLAMA_BASE_URL', 'http://localhost:11434'),
  ollamaModel: readEnv('OLLAMA_MODEL', 'qwen2.5vl:7b'),
  openaiApiKey: readEnv('OPENAI_API_KEY'),
  openaiModel: readEnv('OPENAI_MODEL', 'gpt-4.1-mini'),
  openaiBaseUrl: readEnv(
    'OPENAI_BASE_URL',
    'https://api.openai.com/v1',
  ).replace(/\/$/, ''),
  weatherDefaultCity: process.env.WEATHER_DEFAULT_CITY ?? 'Москва',
};
