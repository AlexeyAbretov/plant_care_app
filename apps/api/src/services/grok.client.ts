import { LlmTimeoutError, LlmUnavailableError } from './llm.errors.js';
import {
  type OpenAiAssistantMessage,
  openAiBodyExtras,
  openAiMessages,
  readOpenAiRound,
} from './llm.protocol.js';
import type { ChatRound, ChatRoundOptions } from './llm.types.js';

import { config } from '../config.js';

interface GrokChatResponse {
  choices?: Array<{
    message?: OpenAiAssistantMessage;
  }>;
}

export async function chat(options: ChatRoundOptions): Promise<ChatRound> {
  if (!config.llmApiKey) {
    throw new LlmUnavailableError('Не задан LLM_API_KEY');
  }

  const imageUrl = `data:${options.mimeType};base64,${options.imageBase64}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, config.llmTimeoutMs);

  try {
    const response = await fetch(`${config.llmBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.llmApiKey}`,
      },
      body: JSON.stringify({
        model: config.llmModel,
        messages: openAiMessages(options, imageUrl),
        ...openAiBodyExtras(options.tools),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new LlmUnavailableError(`Grok недоступен (${response.status})`);
    }

    const data = (await response.json()) as GrokChatResponse;

    return readOpenAiRound(data.choices?.[0]?.message, 'Пустой ответ Grok');
  } catch (error: unknown) {
    if (error instanceof LlmUnavailableError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new LlmTimeoutError();
    }

    throw new LlmUnavailableError('Grok недоступен');
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function checkHealth(): Promise<'ok' | 'unavailable'> {
  if (!config.llmApiKey) {
    return 'unavailable';
  }

  try {
    const response = await fetch(`${config.llmBaseUrl}/models`, {
      headers: { Authorization: `Bearer ${config.llmApiKey}` },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return 'unavailable';
    }

    return 'ok';
  } catch {
    return 'unavailable';
  }
}
