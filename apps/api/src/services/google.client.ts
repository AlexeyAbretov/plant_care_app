import { LlmTimeoutError, LlmUnavailableError } from './llm.errors.js';
import type { ChatWithImageOptions } from './llm.types.js';

import { config } from '../config.js';

interface GoogleGenerateResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
  error?: {
    message?: string;
  };
}

function googleHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-goog-api-key': config.llmApiKey,
  };
}

function googleModelUrl(action: string): string {
  const model = encodeURIComponent(config.llmModel);

  return `${config.llmBaseUrl}/models/${model}${action}`;
}

function gemmaContents(options: ChatWithImageOptions): unknown[] {
  return [
    {
      role: 'user',
      parts: [{ text: options.systemPrompt }],
    },
    {
      role: 'model',
      parts: [{ text: 'Хорошо.' }],
    },
    {
      role: 'user',
      parts: [
        { text: options.userPrompt },
        {
          inline_data: {
            mime_type: options.mimeType,
            data: options.imageBase64,
          },
        },
      ],
    },
  ];
}

function readCandidateText(data: GoogleGenerateResponse): string {
  const parts = data.candidates?.[0]?.content?.parts ?? [];

  return parts
    .map((part) => part.text?.trim() ?? '')
    .filter((text) => text.length > 0)
    .join('\n');
}

async function readGoogleError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as GoogleGenerateResponse;
    const message = data.error?.message?.trim();

    if (message) {
      return message.slice(0, 180);
    }
  } catch {
    return '';
  }

  return '';
}

export async function chat(options: ChatWithImageOptions): Promise<string> {
  if (!config.llmApiKey) {
    throw new LlmUnavailableError('Не задан LLM_API_KEY');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, config.llmTimeoutMs);

  try {
    const response = await fetch(googleModelUrl(':generateContent'), {
      method: 'POST',
      headers: googleHeaders(),
      body: JSON.stringify({
        contents: gemmaContents(options),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await readGoogleError(response);
      const suffix = detail ? `: ${detail}` : '';

      throw new LlmUnavailableError(
        `Gemma недоступна (${response.status})${suffix}`,
      );
    }

    const data = (await response.json()) as GoogleGenerateResponse;
    const content = readCandidateText(data);

    if (!content) {
      const reason = data.promptFeedback?.blockReason;
      const suffix = reason ? ` (${reason})` : '';

      throw new LlmUnavailableError(`Пустой ответ Gemma${suffix}`);
    }

    return content;
  } catch (error: unknown) {
    if (error instanceof LlmUnavailableError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new LlmTimeoutError();
    }

    throw new LlmUnavailableError('Gemma недоступна');
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function checkHealth(): Promise<'ok' | 'unavailable'> {
  if (!config.llmApiKey) {
    return 'unavailable';
  }

  try {
    const response = await fetch(googleModelUrl(''), {
      headers: { 'x-goog-api-key': config.llmApiKey },
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
