import type { Rule } from 'antd/es/form';

export const plantFormRules: Record<string, Rule[]> = {
  name: [{ required: true, message: 'Укажите название растения' }],
  wateringIntervalDays: [
    { required: true, message: 'Укажите интервал полива' },
    { type: 'number', min: 1, message: 'Интервал полива — не менее 1 дня' },
  ],
  fertilizingIntervalDays: [
    { required: true, message: 'Укажите интервал подкормки' },
    {
      type: 'number',
      min: 1,
      message: 'Интервал подкормки — не менее 1 дня',
    },
  ],
  lastWateredAt: [{ required: true, message: 'Укажите дату полива' }],
  lastFertilizedAt: [{ required: true, message: 'Укажите дату подкормки' }],
};
