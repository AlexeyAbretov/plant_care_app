const DAYS_IN_WEEK = 7;
const DAYS_IN_MONTH = 30;

const WORD_COUNTS: Record<string, number> = {
  один: 1,
  одну: 1,
  одна: 1,
  два: 2,
  две: 2,
  три: 3,
  четыре: 4,
  пять: 5,
  шесть: 6,
  семь: 7,
  восемь: 8,
  девять: 9,
  десять: 10,
  двенадцать: 12,
};

const COUNT = String.raw`(\d+|[а-я]+)`;
const RANGE = String.raw`(?:\s*[-–—]\s*(\d+|[а-я]+))?`;
const CADENCE_PREFIX = String.raw`(?:раз\s+в|каждые|кажд(?:ый|ую|ое))`;

function parseCount(raw: string): number | null {
  const token = raw.trim().toLowerCase();

  if (/^\d+$/.test(token)) {
    const value = Number(token);

    return value >= 1 ? value : null;
  }

  return WORD_COUNTS[token] ?? null;
}

function parseRange(start: string, end: string | undefined): number | null {
  const from = parseCount(start);
  const to = end === undefined ? null : parseCount(end);

  if (from === null) {
    return null;
  }

  if (to === null) {
    return from;
  }

  return Math.max(from, to);
}

function matchCadence(text: string, unit: string): number | null {
  const pattern = new RegExp(
    `${CADENCE_PREFIX}\\s+${COUNT}${RANGE}\\s+${unit}`,
  );
  const match = pattern.exec(text);

  if (match?.[1] === undefined) {
    return null;
  }

  return parseRange(match[1], match[2]);
}

export function intervalDaysFromNotes(notes: string): number | null {
  const text = notes.toLowerCase().replaceAll('ё', 'е');
  const months = matchCadence(text, 'месяц');

  if (months !== null) {
    return months * DAYS_IN_MONTH;
  }

  const weeks = matchCadence(text, 'недел');

  if (weeks !== null) {
    return weeks * DAYS_IN_WEEK;
  }

  const days = matchCadence(text, String.raw`д(?:ень|ня|ней|н)`);

  if (days !== null) {
    return days;
  }

  if (/раз\s+в\s+месяц|ежемесяч|каждый\s+месяц/.test(text)) {
    return DAYS_IN_MONTH;
  }

  if (/раз\s+в\s+недел|еженедел|каждую\s+недел/.test(text)) {
    return DAYS_IN_WEEK;
  }

  return null;
}
