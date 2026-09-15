import { config } from '../config.js';

export const OLLAMA_MODEL = 'qwen3-vl:8b';

export class OllamaUnavailableError extends Error {
  constructor(message = 'Ollama недоступен') {
    super(message);
    this.name = 'OllamaUnavailableError';
  }
}

export class OllamaTimeoutError extends Error {
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

interface ChatWithImageOptions {
  systemPrompt: string;
  userPrompt: string;
  imageBase64: string;
}

export async function chatWithImage(
  options: ChatWithImageOptions,
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, config.ollamaTimeoutMs);

  try {
    const response = await fetch(`${config.ollamaBaseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
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
    if (error instanceof OllamaUnavailableError) {
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

export async function checkOllamaHealth(): Promise<'ok' | 'unavailable'> {
  try {
    const response = await fetch(`${config.ollamaBaseUrl}/api/tags`, {
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
