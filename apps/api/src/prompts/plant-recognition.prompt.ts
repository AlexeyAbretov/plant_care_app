const SYSTEM_LINES = [
  'Ты — эксперт по комнатным растениям.',
  'По фото определи растение и верни ТОЛЬКО валидный JSON без markdown',
  'и пояснений.',
  'Все текстовые поля — на русском языке.',
  'Интервалы полива и подкормки — целые числа дней, не меньше 1.',
  'Каждый интервал обязан численно совпадать со своей заметкой.',
  '«Раз в N месяцев» — N, умноженное на число дней в месяце.',
  '«Раз в N недель» — N, умноженное на число дней в неделе.',
  '«Редко» и «когда почва полностью высохнет» — не еженедельный полив:',
  'для суккулентов бери две–три недели.',
];

export const PLANT_RECOGNITION_SYSTEM_PROMPT = SYSTEM_LINES.join('\n');

export const PLANT_RECOGNITION_USER_PROMPT = [
  'Проанализируй фото растения и верни JSON строго по схеме.',
  'В интервалах поставь рассчитанные дни, не шаблонные числа.',
  '{',
  '  "name": "название растения",',
  '  "description": "краткое описание",',
  '  "category": "категория (например: суккуленты, декоративно-лиственные)",',
  '  "lightPreference": "требования к освещению",',
  '  "sizeInfo": "примерный размер и темп роста",',
  '  "wateringIntervalDays": <целое число дней>,',
  '  "fertilizingIntervalDays": <целое число дней>,',
  '  "wateringNotes": "рекомендации по поливу",',
  '  "fertilizingNotes": "рекомендации по подкормке"',
  '}',
].join('\n');

const RETRY_LINES = [
  'Предыдущий ответ не прошёл валидацию.',
  'Верни ТОЛЬКО исправленный JSON по той же схеме, без markdown',
  'и комментариев.',
  'Все 9 полей обязательны; wateringIntervalDays и fertilizingIntervalDays',
  '— целые числа ≥ 1, согласованные с заметками, не плейсхолдеры.',
];

export const PLANT_RECOGNITION_RETRY_PROMPT = RETRY_LINES.join('\n');

const NAME_HINT_MAX_LENGTH = 120;

const NAME_HINT_SYSTEM_LINES = [
  'Если пользователь указал название, оно важнее догадки по фото.',
  'Опиши уход для указанного растения, а не для похожего вида.',
];

const NAME_HINT_USER_LINES = [
  'Пользователь указал название растения: «{name}».',
  'Считай это название верным и не подменяй вид догадкой по фото.',
  'Верни уход, категорию и параметры именно для этого растения.',
  'В поле name оставь указанное название, поправив только орфографию.',
  'Фото используй, чтобы описание совпало с внешним видом.',
];

function normalizeNameHint(nameHint?: string): string | undefined {
  const hint = (nameHint ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[«»"]/g, "'")
    .slice(0, NAME_HINT_MAX_LENGTH);

  if (hint === '') {
    return undefined;
  }

  return hint;
}

export function buildRecognitionSystemPrompt(nameHint?: string): string {
  if (normalizeNameHint(nameHint) === undefined) {
    return PLANT_RECOGNITION_SYSTEM_PROMPT;
  }

  return [PLANT_RECOGNITION_SYSTEM_PROMPT, ...NAME_HINT_SYSTEM_LINES].join(
    '\n',
  );
}

export function buildRecognitionUserPrompt(nameHint?: string): string {
  const hint = normalizeNameHint(nameHint);

  if (hint === undefined) {
    return PLANT_RECOGNITION_USER_PROMPT;
  }

  const hintText = NAME_HINT_USER_LINES.map((line) => {
    return line.replace('{name}', hint);
  }).join('\n');

  return [hintText, PLANT_RECOGNITION_USER_PROMPT].join('\n');
}
