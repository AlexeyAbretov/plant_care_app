import { Button, Form, Input, InputNumber, Radio } from 'antd';

import { PlantDateField } from './PlantDateField';
import type { NameWithRecognizeProps, PlantFormProps } from './PlantForm.types';
import { plantFormRules } from './PlantForm.utils';

const NameWithRecognize = ({
  disabled = false,
  id,
  onChange,
  onRecognize,
  recognizeLoading = false,
  value,
}: NameWithRecognizeProps): React.JSX.Element => {
  const nameMissing = (value ?? '').trim() === '';

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Input
        disabled={disabled}
        id={id}
        onChange={(event) => {
          onChange?.(event.target.value);
        }}
        placeholder="Например, монстера"
        style={{ flex: '1 1 auto', minWidth: 0 }}
        value={value ?? ''}
      />
      <Button
        disabled={disabled || nameMissing}
        htmlType="button"
        loading={recognizeLoading}
        onClick={onRecognize}
      >
        Распознать
      </Button>
    </div>
  );
};

export const PlantForm = ({
  disabled = false,
  onRecognize,
  recognizeLoading = false,
}: PlantFormProps): React.JSX.Element => {
  return (
    <>
      {onRecognize === undefined ? (
        <Form.Item label="Название" name="name" rules={plantFormRules.name}>
          <Input disabled={disabled} placeholder="Например, монстера" />
        </Form.Item>
      ) : (
        <Form.Item label="Название" name="name" rules={plantFormRules.name}>
          <NameWithRecognize
            disabled={disabled}
            onRecognize={onRecognize}
            recognizeLoading={recognizeLoading}
          />
        </Form.Item>
      )}

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
        extra="Комнатным учитываем отопление, уличным — дождь"
        label="Где стоит"
        name="locationKind"
        rules={plantFormRules.locationKind}
      >
        <Radio.Group disabled={disabled}>
          <Radio value="indoor">В помещении</Radio>
          <Radio value="outdoor">На улице / балконе</Radio>
        </Radio.Group>
      </Form.Item>

      <Form.Item
        label="Интервал полива (дней)"
        name="wateringIntervalDays"
        rules={plantFormRules.wateringIntervalDays}
      >
        <InputNumber disabled={disabled} min={1} style={{ width: '7rem' }} />
      </Form.Item>

      <Form.Item
        label="Интервал подкормки (дней)"
        name="fertilizingIntervalDays"
        rules={plantFormRules.fertilizingIntervalDays}
      >
        <InputNumber disabled={disabled} min={1} style={{ width: '7rem' }} />
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
        <PlantDateField disabled={disabled} />
      </Form.Item>

      <Form.Item
        label="Последняя подкормка"
        name="lastFertilizedAt"
        rules={plantFormRules.lastFertilizedAt}
      >
        <PlantDateField disabled={disabled} />
      </Form.Item>
    </>
  );
};
