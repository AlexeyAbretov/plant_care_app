import { LlmUnavailableError } from './llm.errors.js';
import type {
  ChatRound,
  ChatRoundOptions,
  LlmTool,
  LlmTurn,
  ToolCall,
} from './llm.types.js';

export interface OpenAiFunctionCall {
  id?: string;
  function?: {
    name?: string;
    arguments?: unknown;
  };
}

export interface OpenAiAssistantMessage {
  content?: string | null;
  tool_calls?: OpenAiFunctionCall[];
}

export function parseToolArguments(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value ?? {};
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

export function toolCallId(id: string | undefined): string {
  const trimmed = id?.trim() ?? '';

  if (trimmed === '') {
    return crypto.randomUUID();
  }

  return trimmed;
}

export function toFunctionTools(tools: LlmTool[]): unknown[] {
  return tools.map((tool) => {
    return {
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    };
  });
}

export function openAiMessages(
  options: ChatRoundOptions,
  imageUrl: string,
): unknown[] {
  const messages: unknown[] = [
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
  ];

  for (const turn of options.turns ?? []) {
    messages.push(openAiTurn(turn));
  }

  return messages;
}

export function openAiBodyExtras(
  tools: LlmTool[] | undefined,
): Record<string, unknown> {
  if (!tools?.length) {
    return { response_format: { type: 'json_object' } };
  }

  return { tools: toFunctionTools(tools) };
}

export function readOpenAiRound(
  message: OpenAiAssistantMessage | undefined,
  emptyMessage: string,
): ChatRound {
  const rawCalls = message?.tool_calls ?? [];

  if (rawCalls.length > 0) {
    const { calls, toolCalls } = readOpenAiCalls(rawCalls);

    return {
      kind: 'tool_calls',
      calls,
      message: {
        role: 'assistant',
        content: message?.content ?? null,
        tool_calls: toolCalls,
      },
    };
  }

  const content = message?.content?.trim() ?? '';

  if (content === '') {
    throw new LlmUnavailableError(emptyMessage);
  }

  return { kind: 'text', content };
}

function openAiTurn(turn: LlmTurn): unknown {
  if (turn.role === 'assistant') {
    return turn.message;
  }

  return {
    role: 'tool',
    tool_call_id: turn.callId,
    content: turn.content,
  };
}

function readOpenAiCalls(rawCalls: OpenAiFunctionCall[]): {
  calls: ToolCall[];
  toolCalls: unknown[];
} {
  const calls: ToolCall[] = [];
  const toolCalls: unknown[] = [];

  for (const raw of rawCalls) {
    const name = raw.function?.name?.trim() ?? '';

    if (name === '') {
      throw new LlmUnavailableError('Модель вернула вызов без имени');
    }

    const id = toolCallId(raw.id);

    calls.push({
      id,
      name,
      arguments: parseToolArguments(raw.function?.arguments),
    });
    toolCalls.push({
      id,
      type: 'function',
      function: {
        name,
        arguments: echoArguments(raw.function?.arguments),
      },
    });
  }

  return { calls, toolCalls };
}

function echoArguments(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  return JSON.stringify(value ?? {});
}
