import { DatePicker, Form, Input, InputNumber } from 'antd';
import type { Dayjs } from 'dayjs';

import { plantFormRules } from './plantFormRules';

export type PlantFormValues = {
  name: string;
  description: string;
  category: string;
  lightPreference: string;
  sizeInfo: string;
  wateringIntervalDays?: number;
  fertilizingIntervalDays?: number;
  wateringNotes: string;
  fertilizingNotes: string;
  lastWateredAt: Dayjs;
  lastFertilizedAt: Dayjs;
};

type PlantFormProps = {
  disabled?: boolean;
};

export function PlantForm({
  disabled = false,
}: PlantFormProps): React.JSX.Element {
  return (
    <>
      <Form.Item label="Название" name="name" rules={plantFormRules.name}>
        <Input disabled={disabled} placeholder="Например, монстера" />
      </Form.Item>

      <Form.Item label="Описание" name="description">
        <Input.TextArea
          disabled={disabled}
          placeholder="Краткое описание растения"
          rows={3}
        />
      </Form.Item>

      <Form.Item label="Категория" name="category">
        <Input disabled={disabled} placeholder="Например, декоративные" />
      </Form.Item>

      <Form.Item label="Освещение" name="lightPreference">
        <Input disabled={disabled} placeholder="Яркий рассеянный свет" />
      </Form.Item>

      <Form.Item label="Размер" name="sizeInfo">
        <Input disabled={disabled} placeholder="Средний куст" />
      </Form.Item>

      <Form.Item
        label="Интервал полива (дней)"
        name="wateringIntervalDays"
        rules={plantFormRules.wateringIntervalDays}
      >
        <InputNumber disabled={disabled} min={1} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        label="Интервал подкормки (дней)"
        name="fertilizingIntervalDays"
        rules={plantFormRules.fertilizingIntervalDays}
      >
        <InputNumber disabled={disabled} min={1} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item label="Заметки по поливу" name="wateringNotes">
        <Input.TextArea
          disabled={disabled}
          placeholder="Как и сколько поливать"
          rows={2}
        />
      </Form.Item>

      <Form.Item label="Заметки по подкормке" name="fertilizingNotes">
        <Input.TextArea
          disabled={disabled}
          placeholder="Когда и чем подкармливать"
          rows={2}
        />
      </Form.Item>

      <Form.Item
        label="Последний полив"
        name="lastWateredAt"
        rules={plantFormRules.lastWateredAt}
      >
        <DatePicker
          disabled={disabled}
          format="DD.MM.YYYY"
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item
        label="Последняя подкормка"
        name="lastFertilizedAt"
        rules={plantFormRules.lastFertilizedAt}
      >
        <DatePicker
          disabled={disabled}
          format="DD.MM.YYYY"
          style={{ width: '100%' }}
        />
      </Form.Item>
    </>
  );
}
