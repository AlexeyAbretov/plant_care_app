export const PLANT_RECOGNITION_SYSTEM_PROMPT = `Ты — эксперт по комнатным растениям.
По фото определи растение и верни ТОЛЬКО валидный JSON без markdown и пояснений.
Все текстовые поля — на русском языке.
Интервалы полива и подкормки — целые числа дней, не меньше 1.`;

export const PLANT_RECOGNITION_USER_PROMPT = `Проанализируй фото растения и верни JSON строго по схеме:
{
  "name": "название растения",
  "description": "краткое описание",
  "category": "категория (например: суккуленты, декоративно-лиственные)",
  "lightPreference": "требования к освещению",
  "sizeInfo": "примерный размер и темп роста",
  "wateringIntervalDays": 7,
  "fertilizingIntervalDays": 30,
  "wateringNotes": "рекомендации по поливу",
  "fertilizingNotes": "рекомендации по подкормке"
}`;

export const PLANT_RECOGNITION_RETRY_PROMPT = `Предыдущий ответ не прошёл валидацию.
Верни ТОЛЬКО исправленный JSON по той же схеме, без markdown и комментариев.
Все 9 полей обязательны; wateringIntervalDays и fertilizingIntervalDays — целые числа ≥ 1.`;
