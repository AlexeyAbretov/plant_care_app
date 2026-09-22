import { LlmTimeoutError, LlmUnavailableError } from './llm.errors.js';
import type { ChatWithImageOptions } from './llm.types.js';

import { config } from '../config.js';

interface OpenAiChatResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

export async function chatWithOpenAi(
  options: ChatWithImageOptions,
): Promise<string> {
  if (!config.openaiApiKey) {
    throw new LlmUnavailableError('Не задан OPENAI_API_KEY');
  }

  const imageUrl = `data:${options.mimeType};base64,${options.imageBase64}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, config.llmTimeoutMs);

  try {
    const response = await fetch(`${config.openaiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: config.openaiModel,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: options.systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: options.userPrompt },
              {
                type: 'image_url',
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new LlmUnavailableError(`ChatGPT недоступен (${response.status})`);
    }

    const data = (await response.json()) as OpenAiChatResponse;
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new LlmUnavailableError('Пустой ответ ChatGPT');
    }

    return content;
  } catch (error: unknown) {
    if (error instanceof LlmUnavailableError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new LlmTimeoutError();
    }

    throw new LlmUnavailableError('ChatGPT недоступен');
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function checkOpenAiHealth(): Promise<'ok' | 'unavailable'> {
  if (!config.openaiApiKey) {
    return 'unavailable';
  }

  try {
    const response = await fetch(`${config.openaiBaseUrl}/models`, {
      headers: { Authorization: `Bearer ${config.openaiApiKey}` },
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
