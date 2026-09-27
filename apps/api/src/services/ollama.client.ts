import { LlmTimeoutError, LlmUnavailableError } from './llm.errors.js';
import { parseToolArguments, toFunctionTools } from './llm.protocol.js';
import type { ChatRound, ChatRoundOptions, ToolCall } from './llm.types.js';

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

interface OllamaToolCall {
  function?: {
    name?: string;
    arguments?: unknown;
  };
}

interface OllamaMessage {
  role?: string;
  content?: string;
  tool_calls?: OllamaToolCall[];
}

interface OllamaChatResponse {
  message?: OllamaMessage;
}

export async function chat(options: ChatRoundOptions): Promise<ChatRound> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, config.llmTimeoutMs);

  try {
    const response = await fetch(`${config.llmBaseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ollamaBody(options)),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await readOllamaError(response);
      const suffix = detail ? `: ${detail}` : '';

      throw new OllamaUnavailableError(
        `Ollama недоступен (${response.status})${suffix}`,
      );
    }

    const data = (await response.json()) as OllamaChatResponse;

    return readOllamaRound(data.message);
  } catch (error: unknown) {
    if (error instanceof LlmUnavailableError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new OllamaTimeoutError();
    }

    const detail = error instanceof Error ? error.message.trim() : '';
    const suffix = detail ? `: ${detail.slice(0, 180)}` : '';

    throw new OllamaUnavailableError(`Ollama недоступен${suffix}`);
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

async function readOllamaError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: unknown };
    const message = typeof data.error === 'string' ? data.error.trim() : '';

    if (message !== '') {
      return message.slice(0, 180);
    }
  } catch {
    return '';
  }

  return '';
}

function ollamaBody(options: ChatRoundOptions): Record<string, unknown> {
  const tools = options.tools ?? [];
  const body: Record<string, unknown> = {
    model: config.llmModel,
    stream: false,
    messages: ollamaMessages(options),
  };

  if (tools.length === 0) {
    body.format = 'json';

    return body;
  }

  body.tools = toFunctionTools(tools);

  return body;
}

function ollamaMessages(options: ChatRoundOptions): unknown[] {
  const messages: unknown[] = [
    { role: 'system', content: options.systemPrompt },
    {
      role: 'user',
      content: options.userPrompt,
      images: [options.imageBase64],
    },
  ];

  for (const turn of options.turns ?? []) {
    if (turn.role === 'assistant') {
      messages.push(turn.message);
      continue;
    }

    messages.push({
      role: 'tool',
      tool_name: turn.name,
      content: turn.content,
    });
  }

  return messages;
}

function readOllamaRound(message: OllamaMessage | undefined): ChatRound {
  const rawCalls = message?.tool_calls ?? [];

  if (rawCalls.length > 0) {
    return {
      kind: 'tool_calls',
      calls: rawCalls.map(readOllamaCall),
      message,
    };
  }

  const content = message?.content?.trim() ?? '';

  if (content === '') {
    throw new OllamaUnavailableError('Пустой ответ Ollama');
  }

  return { kind: 'text', content };
}

function readOllamaCall(raw: OllamaToolCall): ToolCall {
  const name = raw.function?.name?.trim() ?? '';

  if (name === '') {
    throw new OllamaUnavailableError('Модель вернула вызов без имени');
  }

  return {
    id: crypto.randomUUID(),
    name,
    arguments: parseToolArguments(raw.function?.arguments),
  };
}
