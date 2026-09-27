import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { LlmTool, ToolCall } from './llm.types.js';

import { config } from '../config.js';

export type LlmLogEvent =
  | { kind: 'assistant'; content: string }
  | { kind: 'tool_calls'; calls: ToolCall[] }
  | { kind: 'tool_result'; name: string; content: string }
  | { kind: 'error'; message: string };

export interface LlmChatLogInput {
  systemPrompt: string;
  userPrompt: string;
  mimeType: string;
  imageBase64Length: number;
  tools?: LlmTool[];
  events: LlmLogEvent[];
}

export function writeLlmChatLog(input: LlmChatLogInput): Promise<void> {
  const entry = renderEntry(input);

  return writeEntry(entry);
}

function renderEntry(input: LlmChatLogInput): string {
  const when = new Date().toISOString();
  const title = `${when} ${config.llmProvider} ${config.llmModel}`;
  const blocks = [
    `===== ${title} =====`,
    section('система', input.systemPrompt),
    section('пользователь', input.userPrompt),
    section(
      'изображение',
      `${input.mimeType}, base64 ${input.imageBase64Length} символов`,
    ),
  ];
  const tools = renderTools(input.tools);

  if (tools !== undefined) {
    blocks.push(tools);
  }

  for (const event of input.events) {
    blocks.push(renderEvent(event));
  }

  return `${blocks.join('\n\n')}\n\n`;
}

function renderTools(tools: LlmTool[] | undefined): string | undefined {
  if (tools === undefined || tools.length === 0) {
    return undefined;
  }

  const body = tools
    .map((tool) => {
      return `${tool.name}\n${tool.description}`;
    })
    .join('\n\n');

  return section('инструменты', body);
}

function renderEvent(event: LlmLogEvent): string {
  if (event.kind === 'assistant') {
    return section('ассистент', event.content);
  }

  if (event.kind === 'tool_calls') {
    const body = event.calls.map(renderCall).join('\n\n');

    return section('вызов', body);
  }

  if (event.kind === 'tool_result') {
    return section(`результат ${event.name}`, event.content);
  }

  return section('ошибка', event.message);
}

function renderCall(call: ToolCall): string {
  return `${call.name} (${call.id})\n${formatArguments(call.arguments)}`;
}

function formatArguments(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function section(title: string, body: string): string {
  return `[${title}]\n${body}`;
}

function chatLogPath(): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const id = crypto.randomUUID().slice(0, 8);

  return path.join(config.llmLogDir, `${stamp}-${id}.log`);
}

async function writeEntry(entry: string): Promise<void> {
  try {
    await mkdir(config.llmLogDir, { recursive: true });
    await writeFile(chatLogPath(), entry, 'utf8');
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'неизвестная ошибка';

    console.error(`Не удалось записать лог LLM: ${message}`);
  }
}
