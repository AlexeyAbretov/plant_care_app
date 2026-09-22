import { LlmUnavailableError } from './llm.errors.js';
import type { ChatWithImageOptions, LlmClient } from './llm.types.js';

import { config } from '../config.js';

export type { ChatWithImageOptions } from './llm.types.js';

const PROVIDER_NAME = /^[a-z0-9-]+$/;

let clientPromise: Promise<LlmClient> | undefined;

function assertProviderName(provider: string): void {
  if (PROVIDER_NAME.test(provider)) {
    return;
  }

  throw new LlmUnavailableError(`Неизвестный провайдер LLM: ${provider}`);
}

async function importClient(provider: string): Promise<LlmClient> {
  try {
    const imported = (await import(
      `./${provider}.client.js`
    )) as Partial<LlmClient>;

    if (
      typeof imported.chat !== 'function' ||
      typeof imported.checkHealth !== 'function'
    ) {
      throw new LlmUnavailableError(
        `Провайдер ${provider} не реализует LLM-клиент`,
      );
    }

    return {
      chat: imported.chat,
      checkHealth: imported.checkHealth,
    };
  } catch (error: unknown) {
    if (error instanceof LlmUnavailableError) {
      throw error;
    }

    throw new LlmUnavailableError(`Провайдер LLM не найден: ${provider}`);
  }
}

function loadClient(): Promise<LlmClient> {
  const provider = config.llmProvider;

  assertProviderName(provider);
  clientPromise ??= importClient(provider);

  return clientPromise.catch((error: unknown) => {
    clientPromise = undefined;

    throw error;
  });
}

export function activeLlmModel(): string {
  return config.llmModel;
}

export async function chatWithImage(
  options: ChatWithImageOptions,
): Promise<string> {
  const client = await loadClient();

  return client.chat(options);
}

export async function checkLlmHealth(): Promise<{
  provider: string;
  model: string;
  status: 'ok' | 'unavailable';
}> {
  try {
    const client = await loadClient();

    return {
      provider: config.llmProvider,
      model: config.llmModel,
      status: await client.checkHealth(),
    };
  } catch {
    return {
      provider: config.llmProvider,
      model: config.llmModel,
      status: 'unavailable',
    };
  }
}
