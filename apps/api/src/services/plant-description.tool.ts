import type { LlmTool, ToolCall } from './llm.types.js';
import { lookupPlantDescription } from './perenual.client.js';

const QUERY_MAX_LENGTH = 120;

export const PLANT_DESCRIPTION_TOOL: LlmTool = {
  name: 'lookup_plant_description',
  description: [
    'Ищет вид в каталоге Perenual и возвращает английское описание',
    'и факты ухода. Вызывай по латинскому имени.',
  ].join(' '),
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'Латинское или английское имя, например Monstera deliciosa',
      },
    },
    required: ['query'],
  },
};

export async function executePlantDescriptionTool(
  call: ToolCall,
): Promise<string> {
  if (call.name !== PLANT_DESCRIPTION_TOOL.name) {
    return JSON.stringify({
      found: false,
      reason: 'Неизвестный инструмент',
    });
  }

  const query = readQuery(call.arguments);

  if (query === '') {
    return JSON.stringify({ found: false, reason: 'Пустой запрос' });
  }

  const result = await lookupPlantDescription(query);

  return JSON.stringify(result);
}

export function readCatalogDescription(content: string): string {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    return '';
  }

  const record = asRecord(parsed);
  const description = record?.description;

  if (record?.found !== true || typeof description !== 'string') {
    return '';
  }

  return description.trim();
}

function readQuery(value: unknown): string {
  const query = asRecord(value)?.query;

  if (typeof query !== 'string') {
    return '';
  }

  return query.trim().replace(/\s+/g, ' ').slice(0, QUERY_MAX_LENGTH);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
}
