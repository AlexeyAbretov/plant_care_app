import { chatWithImage, chatWithTools } from './llm.client.js';
import {
  executePlantDescriptionTool,
  PLANT_DESCRIPTION_TOOL,
  readCatalogDescription,
} from './plant-description.tool.js';

import {
  buildRecognitionSystemPrompt,
  buildRecognitionUserPrompt,
  PLANT_RECOGNITION_RETRY_PROMPT,
} from '../prompts/plant-recognition.prompt.js';
import {
  type PlantRecognitionResult,
  plantRecognitionSchema,
} from '../schemas/plant-recognition.schema.js';
import { intervalDaysFromNotes } from '../utils/careIntervalFromNotes.js';
import { extractJson } from '../utils/extract-json.js';

export class PlantRecognitionError extends Error {
  constructor(message = 'Не удалось распознать растение') {
    super(message);
    this.name = 'PlantRecognitionError';
  }
}

export class InvalidImageFormatError extends Error {
  constructor(message = 'Неподдерживаемый формат изображения') {
    super(message);
    this.name = 'InvalidImageFormatError';
  }
}

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function validateImageMime(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

const TRANSLATE_SYSTEM_PROMPT = [
  'Переведи текст на русский дословно.',
  'Фото не используй.',
  'Не добавляй и не убирай факты.',
  'Числа оставь как в тексте.',
  'Единицы не пересчитывай: feet — футы, inches — дюймы.',
  'Верни только JSON {"text":"перевод"}.',
].join('\n');

const UNIT_CHECKS: Array<{ source: RegExp; target: RegExp }> = [
  { source: /\d+\s*feet\b/i, target: /фут/i },
  { source: /\d+\s*inches?\b/i, target: /дюйм/i },
];

async function alignDescription(
  content: string,
  toolResults: string[],
  imageBase64: string,
  mimeType: string,
): Promise<string> {
  const catalog = catalogDescription(toolResults);

  if (catalog === '') {
    return content;
  }

  let parsed: PlantRecognitionResult;

  try {
    parsed = parseRecognitionContent(content);
  } catch {
    return content;
  }

  const description = await translateCatalogDescription(
    catalog,
    imageBase64,
    mimeType,
  );

  return JSON.stringify({ ...parsed, description }, null, 2);
}

function catalogDescription(toolResults: string[]): string {
  let description = '';

  for (const content of toolResults) {
    const next = readCatalogDescription(content);

    if (next !== '') {
      description = next;
    }
  }

  return description;
}

async function translateCatalogDescription(
  source: string,
  imageBase64: string,
  mimeType: string,
): Promise<string> {
  const first = await requestTranslation(source, imageBase64, mimeType);

  if (translationIsFaithful(source, first)) {
    return first;
  }

  const second = await requestTranslation(source, imageBase64, mimeType);

  if (translationIsFaithful(source, second)) {
    return second;
  }

  return source;
}

async function requestTranslation(
  source: string,
  imageBase64: string,
  mimeType: string,
): Promise<string> {
  try {
    const content = await chatWithImage({
      systemPrompt: TRANSLATE_SYSTEM_PROMPT,
      userPrompt: source,
      imageBase64,
      mimeType,
    });

    return readTranslatedText(content);
  } catch {
    return '';
  }
}

function readTranslatedText(content: string): string {
  let parsed: unknown;

  try {
    parsed = JSON.parse(extractJson(content));
  } catch {
    return '';
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return '';
  }

  const text = (parsed as Record<string, unknown>).text;

  if (typeof text !== 'string') {
    return '';
  }

  return text.trim();
}

function translationIsFaithful(source: string, translated: string): boolean {
  if (translated === '') {
    return false;
  }

  const numbers = source.match(/\d+(?:[.,]\d+)?/g) ?? [];
  const numbersKept = numbers.every((number) => {
    return translated.includes(number);
  });

  if (!numbersKept) {
    return false;
  }

  return UNIT_CHECKS.every((check) => {
    if (!check.source.test(source)) {
      return true;
    }

    return check.target.test(translated);
  });
}

function parseRecognitionContent(content: string): PlantRecognitionResult {
  const jsonText = extractJson(content);

  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new PlantRecognitionError();
  }

  const result = plantRecognitionSchema.safeParse(parsed);

  if (!result.success) {
    throw new PlantRecognitionError();
  }

  const { wateringNotes, fertilizingNotes } = result.data;

  return {
    ...result.data,
    wateringIntervalDays:
      intervalDaysFromNotes(wateringNotes) ?? result.data.wateringIntervalDays,
    fertilizingIntervalDays:
      intervalDaysFromNotes(fertilizingNotes) ??
      result.data.fertilizingIntervalDays,
  };
}

export async function recognizePlantFromImage(
  imageBuffer: Buffer,
  mimeType: string,
  nameHint?: string,
): Promise<PlantRecognitionResult> {
  if (!validateImageMime(mimeType)) {
    throw new InvalidImageFormatError();
  }

  const imageBase64 = imageBuffer.toString('base64');
  const systemPrompt = buildRecognitionSystemPrompt(nameHint);
  const userPrompt = buildRecognitionUserPrompt(nameHint);

  async function reviseAnswer(
    content: string,
    toolResults: string[],
  ): Promise<string> {
    return alignDescription(content, toolResults, imageBase64, mimeType);
  }

  const firstResponse = await chatWithTools({
    systemPrompt,
    userPrompt,
    imageBase64,
    mimeType,
    tools: [PLANT_DESCRIPTION_TOOL],
    executeTool: executePlantDescriptionTool,
    reviseAnswer,
  });

  try {
    return parseRecognitionContent(firstResponse);
  } catch {
    const retryUserPrompt = [userPrompt, PLANT_RECOGNITION_RETRY_PROMPT].join(
      '\n\n',
    );

    const retryResponse = await chatWithTools({
      systemPrompt,
      userPrompt: retryUserPrompt,
      imageBase64,
      mimeType,
      tools: [PLANT_DESCRIPTION_TOOL],
      executeTool: executePlantDescriptionTool,
      reviseAnswer,
    });

    return parseRecognitionContent(retryResponse);
  }
}
