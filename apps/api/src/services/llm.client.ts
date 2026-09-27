import { LlmUnavailableError } from './llm.errors.js';
import {
  type LlmChatLogInput,
  type LlmLogEvent,
  writeLlmChatLog,
} from './llm.log.js';
import type {
  ChatRoundOptions,
  ChatWithImageOptions,
  ChatWithToolsOptions,
  LlmClient,
  LlmTurn,
} from './llm.types.js';

import { config } from '../config.js';

export type {
  ChatRound,
  ChatWithImageOptions,
  ChatWithToolsOptions,
  LlmTool,
  LlmTurn,
  ToolCall,
} from './llm.types.js';

const MAX_TOOL_ROUNDS = 3;

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
  const events: LlmLogEvent[] = [];

  try {
    const client = await loadClient();
    const result = await client.chat(options);

    if (result.kind === 'tool_calls') {
      events.push({ kind: 'tool_calls', calls: result.calls });

      throw new LlmUnavailableError(
        'Модель запросила инструмент без исполнителя',
      );
    }

    events.push({ kind: 'assistant', content: result.content });

    return result.content;
  } catch (error: unknown) {
    events.push({ kind: 'error', message: errorText(error) });

    throw error;
  } finally {
    await writeLlmChatLog(logInput(options, events));
  }
}

export async function chatWithTools(
  options: ChatWithToolsOptions,
): Promise<string> {
  const events: LlmLogEvent[] = [];

  try {
    const client = await loadClient();
    const turns: LlmTurn[] = [];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
      const result = await client.chat(roundOptions(options, turns));

      if (result.kind === 'text') {
        events.push({ kind: 'assistant', content: result.content });

        return result.content;
      }

      events.push({ kind: 'tool_calls', calls: result.calls });

      if (result.calls.length === 0) {
        throw new LlmUnavailableError(
          'Модель вернула пустой вызов инструмента',
        );
      }

      if (round === MAX_TOOL_ROUNDS - 1) {
        break;
      }

      turns.push({ role: 'assistant', message: result.message });

      for (const call of result.calls) {
        const content = await options.executeTool(call);

        events.push({
          kind: 'tool_result',
          name: call.name,
          content,
        });
        turns.push({
          role: 'tool',
          callId: call.id,
          name: call.name,
          content,
        });
      }
    }

    throw new LlmUnavailableError('Превышено число вызовов инструментов');
  } catch (error: unknown) {
    events.push({ kind: 'error', message: errorText(error) });

    throw error;
  } finally {
    await writeLlmChatLog(logInput(options, events, options.tools));
  }
}

function logInput(
  options: ChatWithImageOptions,
  events: LlmLogEvent[],
  tools?: ChatWithToolsOptions['tools'],
): LlmChatLogInput {
  return {
    systemPrompt: options.systemPrompt,
    userPrompt: options.userPrompt,
    mimeType: options.mimeType,
    imageBase64Length: options.imageBase64.length,
    tools,
    events,
  };
}

function errorText(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'неизвестная ошибка';
}

function roundOptions(
  options: ChatWithToolsOptions,
  turns: LlmTurn[],
): ChatRoundOptions {
  return {
    systemPrompt: options.systemPrompt,
    userPrompt: options.userPrompt,
    imageBase64: options.imageBase64,
    mimeType: options.mimeType,
    tools: options.tools,
    turns,
  };
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
