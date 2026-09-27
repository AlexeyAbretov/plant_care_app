import { LlmTimeoutError, LlmUnavailableError } from './llm.errors.js';
import { parseToolArguments, toolCallId } from './llm.protocol.js';
import type {
  ChatRound,
  ChatRoundOptions,
  LlmTool,
  LlmTurn,
  ToolCall,
} from './llm.types.js';

import { config } from '../config.js';

interface GooglePart {
  text?: string;
  functionCall?: {
    id?: string;
    name?: string;
    args?: unknown;
  };
}

interface GoogleContent {
  role?: string;
  parts?: GooglePart[];
}

interface GoogleGenerateResponse {
  candidates?: Array<{
    content?: GoogleContent;
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

function gemmaContents(options: ChatRoundOptions): unknown[] {
  const contents: unknown[] = [
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

  appendGoogleTurns(contents, options.turns);

  return contents;
}

function appendGoogleTurns(
  contents: unknown[],
  turns: LlmTurn[] | undefined,
): void {
  const pending: Array<Extract<LlmTurn, { role: 'tool' }>> = [];

  function flush(): void {
    if (pending.length === 0) {
      return;
    }

    contents.push({
      role: 'user',
      parts: pending.map((turn) => {
        return {
          functionResponse: {
            name: turn.name,
            response: { result: turn.content },
          },
        };
      }),
    });
    pending.length = 0;
  }

  for (const turn of turns ?? []) {
    if (turn.role === 'tool') {
      pending.push(turn);
      continue;
    }

    flush();
    contents.push(turn.message);
  }

  flush();
}

function googleTools(tools: LlmTool[] | undefined): unknown[] | undefined {
  if (!tools?.length) {
    return undefined;
  }

  return [
    {
      functionDeclarations: tools.map((tool) => {
        return {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        };
      }),
    },
  ];
}

function readGoogleRound(data: GoogleGenerateResponse): ChatRound {
  const content = data.candidates?.[0]?.content;
  const parts = content?.parts ?? [];
  const calls = readGoogleCalls(parts);

  if (calls.length > 0) {
    return {
      kind: 'tool_calls',
      calls,
      message: {
        role: 'model',
        parts,
      },
    };
  }

  const text = parts
    .map((part) => part.text?.trim() ?? '')
    .filter((item) => item.length > 0)
    .join('\n');

  if (text === '') {
    const reason = data.promptFeedback?.blockReason;
    const suffix = reason ? ` (${reason})` : '';

    throw new LlmUnavailableError(`Пустой ответ Gemma${suffix}`);
  }

  return { kind: 'text', content: text };
}

function readGoogleCalls(parts: GooglePart[]): ToolCall[] {
  const calls: ToolCall[] = [];

  for (const part of parts) {
    if (part.functionCall === undefined) {
      continue;
    }

    const name = part.functionCall.name?.trim() ?? '';

    if (name === '') {
      throw new LlmUnavailableError('Модель вернула вызов без имени');
    }

    calls.push({
      id: toolCallId(part.functionCall.id),
      name,
      arguments: parseToolArguments(part.functionCall.args),
    });
  }

  return calls;
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

export async function chat(options: ChatRoundOptions): Promise<ChatRound> {
  if (!config.llmApiKey) {
    throw new LlmUnavailableError('Не задан LLM_API_KEY');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, config.llmTimeoutMs);

  try {
    const tools = googleTools(options.tools);
    const body: Record<string, unknown> = {
      contents: gemmaContents(options),
    };

    if (tools !== undefined) {
      body.tools = tools;
    }

    const response = await fetch(googleModelUrl(':generateContent'), {
      method: 'POST',
      headers: googleHeaders(),
      body: JSON.stringify(body),
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

    return readGoogleRound(data);
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
