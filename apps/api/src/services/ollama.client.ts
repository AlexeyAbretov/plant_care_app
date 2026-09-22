import { LlmTimeoutError, LlmUnavailableError } from './llm.errors.js';
import type { ChatWithImageOptions } from './llm.types.js';

import { config } from '../config.js';

export class OllamaUnavailableError extends LlmUnavailableError {
  constructor(message = 'Ollama недоступен') {
    super(message);
    this.name = 'OllamaUnavailableError';
  }
}

export class OllamaTimeoutError extends LlmTimeoutError {
  constructor(message = 'Превышено время ожидания') {
    super(message);
    this.name = 'OllamaTimeoutError';
  }
}

interface OllamaChatResponse {
  message?: {
    content?: string;
  };
}

export async function chat(options: ChatWithImageOptions): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, config.llmTimeoutMs);

  try {
    const response = await fetch(`${config.llmBaseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.llmModel,
        stream: false,
        format: 'json',
        messages: [
          { role: 'system', content: options.systemPrompt },
          {
            role: 'user',
            content: options.userPrompt,
            images: [options.imageBase64],
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new OllamaUnavailableError();
    }

    const data = (await response.json()) as OllamaChatResponse;
    const content = data.message?.content?.trim();

    if (!content) {
      throw new OllamaUnavailableError('Пустой ответ Ollama');
    }

    return content;
  } catch (error: unknown) {
    if (error instanceof LlmUnavailableError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new OllamaTimeoutError();
    }

    throw new OllamaUnavailableError();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function checkHealth(): Promise<'ok' | 'unavailable'> {
  try {
    const response = await fetch(`${config.llmBaseUrl}/api/tags`, {
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
