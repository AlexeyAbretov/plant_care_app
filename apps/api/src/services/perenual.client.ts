import { config } from '../config.js';

const PERENUAL_BASE_URL = 'https://perenual.com/api/v2';
const PERENUAL_TIMEOUT_MS = 15_000;
const DESCRIPTION_MAX_LENGTH = 1500;
const CANDIDATE_LIMIT = 5;
const PAYWALL = /only available for premium|upgrade to premium/i;

export type PlantLookupResult =
  | {
      found: true;
      scientificName: string;
      commonName: string;
      description: string;
      watering: string;
      sunlight: string[];
    }
  | {
      found: false;
      reason: string;
      candidates?: string[];
    };

interface SpeciesItem {
  id: number;
  commonName: string;
  scientificNames: string[];
  otherNames: string[];
}

type SpeciesPick =
  | { kind: 'one'; item: SpeciesItem }
  | { kind: 'many'; names: string[] }
  | { kind: 'none' };

class PerenualRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PerenualRequestError';
  }
}

export async function lookupPlantDescription(
  query: string,
): Promise<PlantLookupResult> {
  if (config.perenualApiKey === '') {
    return { found: false, reason: 'Не задан PERENUAL_API_KEY' };
  }

  const needle = normalizeName(query);

  if (needle === '') {
    return { found: false, reason: 'Пустой запрос' };
  }

  let items: SpeciesItem[];

  try {
    items = readList(await perenualGet('/species-list', { q: query }));
  } catch (error: unknown) {
    return { found: false, reason: perenualReason(error) };
  }

  const selected = selectSpecies(needle, items);

  if (selected.kind === 'none') {
    return { found: false, reason: 'В каталоге нет совпадения' };
  }

  if (selected.kind === 'many') {
    return {
      found: false,
      reason: 'Несколько видов, уточни латинское имя',
      candidates: selected.names,
    };
  }

  try {
    const details = readDetails(
      await perenualGet(`/species/details/${selected.item.id}`, {}),
    );

    return {
      found: true,
      scientificName:
        details.scientificName || selected.item.scientificNames[0] || '',
      commonName: details.commonName || selected.item.commonName,
      description: details.description,
      watering: details.watering,
      sunlight: details.sunlight,
    };
  } catch (error: unknown) {
    return { found: false, reason: perenualReason(error) };
  }
}

async function perenualGet(
  pathname: string,
  search: Record<string, string>,
): Promise<unknown> {
  const url = new URL(`${PERENUAL_BASE_URL}${pathname}`);

  url.searchParams.set('key', config.perenualApiKey);

  for (const [name, value] of Object.entries(search)) {
    url.searchParams.set(name, value);
  }

  const response = await fetch(url, {
    signal: AbortSignal.timeout(PERENUAL_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new PerenualRequestError(statusReason(response.status));
  }

  return response.json() as Promise<unknown>;
}

function statusReason(status: number): string {
  if (status === 401) {
    return 'Неверный ключ Perenual';
  }

  if (status === 429) {
    return 'Превышена квота Perenual';
  }

  if (status === 404) {
    return 'Вид в каталоге не найден';
  }

  return 'Каталог Perenual недоступен';
}

function perenualReason(error: unknown): string {
  if (error instanceof PerenualRequestError) {
    return error.message;
  }

  if (error instanceof Error && error.name === 'TimeoutError') {
    return 'Превышено время ожидания Perenual';
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return 'Превышено время ожидания Perenual';
  }

  return 'Каталог Perenual недоступен';
}

function selectSpecies(needle: string, items: SpeciesItem[]): SpeciesPick {
  const exact = pick(items, (item) => {
    return hasAlias(item, needle, 'exact');
  });

  if (exact !== undefined) {
    return exact;
  }

  const prefixed = pick(items, (item) => {
    return hasScientific(item, needle, 'prefix');
  });

  if (prefixed !== undefined) {
    return prefixed;
  }

  return (
    pick(items, (item) => {
      return hasScientific(item, needle, 'includes');
    }) ?? { kind: 'none' }
  );
}

function pick(
  items: SpeciesItem[],
  predicate: (item: SpeciesItem) => boolean,
): SpeciesPick | undefined {
  const matched = items.filter(predicate);

  if (matched.length === 1) {
    const item = matched[0];

    if (item === undefined) {
      return undefined;
    }

    return { kind: 'one', item };
  }

  if (matched.length > 1) {
    return { kind: 'many', names: candidateNames(matched) };
  }

  return undefined;
}

function hasAlias(item: SpeciesItem, needle: string, mode: 'exact'): boolean {
  const names = [...item.scientificNames, item.commonName, ...item.otherNames];

  return names.some((name) => {
    return nameMatches(name, needle, mode);
  });
}

function hasScientific(
  item: SpeciesItem,
  needle: string,
  mode: 'prefix' | 'includes',
): boolean {
  return item.scientificNames.some((name) => {
    return nameMatches(name, needle, mode);
  });
}

function nameMatches(
  name: string,
  needle: string,
  mode: 'exact' | 'prefix' | 'includes',
): boolean {
  const normalized = normalizeName(name);

  if (normalized === '') {
    return false;
  }

  if (mode === 'exact') {
    return normalized === needle;
  }

  if (mode === 'prefix') {
    return normalized.startsWith(`${needle} `);
  }

  if (normalized.includes(needle)) {
    return true;
  }

  return needle.includes(normalized) && normalized.length >= 4;
}

function candidateNames(items: SpeciesItem[]): string[] {
  const names: string[] = [];

  for (const item of items) {
    const name = item.scientificNames[0] ?? item.commonName;

    if (name === '' || names.includes(name)) {
      continue;
    }

    names.push(name);

    if (names.length === CANDIDATE_LIMIT) {
      break;
    }
  }

  return names;
}

function readList(payload: unknown): SpeciesItem[] {
  const data = asRecord(payload)?.data;

  if (!Array.isArray(data)) {
    return [];
  }

  return data.flatMap((item) => {
    const record = asRecord(item);
    const id = readId(record?.id);

    if (record === undefined || id === undefined) {
      return [];
    }

    return [
      {
        id,
        commonName: readText(record.common_name),
        scientificNames: readNames(record.scientific_name),
        otherNames: readNames(record.other_name),
      },
    ];
  });
}

function readDetails(payload: unknown): {
  scientificName: string;
  commonName: string;
  description: string;
  watering: string;
  sunlight: string[];
} {
  const record = asRecord(payload);

  return {
    scientificName: readNames(record?.scientific_name)[0] ?? '',
    commonName: readText(record?.common_name),
    description: readDescription(record?.description),
    watering: readText(record?.watering),
    sunlight: readNames(record?.sunlight),
  };
}

function readDescription(value: unknown): string {
  const text = plainText(readText(value));

  if (text === '' || PAYWALL.test(text)) {
    return '';
  }

  return text.slice(0, DESCRIPTION_MAX_LENGTH);
}

function plainText(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function readNames(value: unknown): string[] {
  if (typeof value === 'string') {
    const text = value.trim();

    return text === '' ? [] : [text];
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (typeof item !== 'string') {
      return [];
    }

    const text = item.trim();

    return text === '' ? [] : [text];
  });
}

function readText(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function readId(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    return undefined;
  }

  return value;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}
