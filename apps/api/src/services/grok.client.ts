import { LlmTimeoutError, LlmUnavailableError } from './llm.errors.js';
import type { ChatWithImageOptions } from './llm.types.js';

import { config } from '../config.js';

interface GrokChatResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

export async function chat(options: ChatWithImageOptions): Promise<string> {
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
      throw new LlmUnavailableError(`Grok недоступен (${response.status})`);
    }

    const data = (await response.json()) as GrokChatResponse;
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new LlmUnavailableError('Пустой ответ Grok');
    }

    return content;
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
