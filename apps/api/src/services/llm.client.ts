import type { ChatWithImageOptions } from './llm.types.js';
import { chatWithOllama, checkOllamaHealth } from './ollama.client.js';
import { chatWithOpenAi, checkOpenAiHealth } from './openai.client.js';

import { config } from '../config.js';

export type { ChatWithImageOptions } from './llm.types.js';

export async function chatWithImage(
  options: ChatWithImageOptions,
): Promise<string> {
  if (config.llmProvider === 'openai') {
    return chatWithOpenAi(options);
  }

  return chatWithOllama(options);
}

export async function checkLlmHealth(): Promise<{
  provider: typeof config.llmProvider;
  model: string;
  status: 'ok' | 'unavailable';
}> {
  if (config.llmProvider === 'openai') {
    return {
      provider: 'openai',
      model: config.openaiModel,
      status: await checkOpenAiHealth(),
    };
  }

  return {
    provider: 'ollama',
    model: config.ollamaModel,
    status: await checkOllamaHealth(),
  };
}
