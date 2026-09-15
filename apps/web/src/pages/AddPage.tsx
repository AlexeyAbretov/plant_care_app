import { Alert, Button, Form, message, Space, Spin, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ApiError } from '../api/client.js';
import { createPlant, recognizePlant } from '../api/plants.js';
import { ImageUpload } from '../components/plant/ImageUpload.js';
import {
  PlantForm,
  type PlantFormValues,
} from '../components/plant/PlantForm.js';
import type {
  CreatePlantPayload,
  PlantRecognizeResult,
} from '../types/plant.js';

type AddStep = 'upload' | 'recognizing' | 'form' | 'saving';

function getDefaultFormValues(): PlantFormValues {
  const today = dayjs().startOf('day');

  return {
    name: '',
    description: '',
    category: '',
    lightPreference: '',
    sizeInfo: '',
    wateringIntervalDays: 7,
    fertilizingIntervalDays: 30,
    wateringNotes: '',
    fertilizingNotes: '',
    lastWateredAt: today,
    lastFertilizedAt: today,
  };
}

function mapRecognizeToFormValues(
  result: PlantRecognizeResult,
): PlantFormValues {
  const today = dayjs().startOf('day');

  return {
    ...result,
    lastWateredAt: today,
    lastFertilizedAt: today,
  };
}

function formatDateForApi(value: Dayjs): string {
  return value.startOf('day').format('YYYY-MM-DD');
}

function mapFormValuesToPayload(values: PlantFormValues): CreatePlantPayload {
  return {
    name: values.name.trim(),
    description: values.description ?? '',
    category: values.category ?? '',
    lightPreference: values.lightPreference ?? '',
    sizeInfo: values.sizeInfo ?? '',
    wateringIntervalDays: values.wateringIntervalDays,
    fertilizingIntervalDays: values.fertilizingIntervalDays,
    wateringNotes: values.wateringNotes ?? '',
    fertilizingNotes: values.fertilizingNotes ?? '',
    lastWateredAt: formatDateForApi(values.lastWateredAt),
    lastFertilizedAt: formatDateForApi(values.lastFertilizedAt),
  };
}

export function AddPage(): React.JSX.Element {
  const navigate = useNavigate();
  const [form] = Form.useForm<PlantFormValues>();
  const [step, setStep] = useState<AddStep>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recognizeError, setRecognizeError] = useState<string | null>(null);

  useEffect(() => {
    if (imageFile === null) {
      setPreviewUrl(null);

      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);

    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

  function openManualForm(): void {
    setRecognizeError(null);
    form.setFieldsValue(getDefaultFormValues());
    setStep('form');
  }

  async function handleRecognize(): Promise<void> {
    if (imageFile === null) {
      message.error('Загрузите фото растения');

      return;
    }

    setRecognizeError(null);
    setStep('recognizing');

    try {
      const result = await recognizePlant(imageFile);

      form.setFieldsValue(mapRecognizeToFormValues(result));
      setStep('form');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : 'Не удалось распознать растение';

      setRecognizeError(errorMessage);
      form.setFieldsValue(getDefaultFormValues());
      setStep('form');
    }
  }

  async function handleSubmit(values: PlantFormValues): Promise<void> {
    if (imageFile === null) {
      message.error('Загрузите фото растения');

      return;
    }

    setStep('saving');

    try {
      await createPlant(mapFormValuesToPayload(values), imageFile);
      message.success('Растение сохранено');
      navigate('/');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : 'Не удалось сохранить растение';

      message.error(errorMessage);
      setStep('form');
    }
  }

  const isBusy = step === 'recognizing' || step === 'saving';

  return (
    <Spin spinning={step === 'recognizing'} tip="Распознаём растение…">
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Добавить растение
      </Typography.Title>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <ImageUpload
          disabled={isBusy || step === 'form'}
          file={imageFile}
          onFileSelect={setImageFile}
          previewUrl={previewUrl}
        />

        {step === 'upload' ? (
          <Space wrap>
            <Button
              disabled={imageFile === null}
              onClick={() => {
                void handleRecognize();
              }}
              type="primary"
            >
              Распознать растение
            </Button>
            <Button disabled={imageFile === null} onClick={openManualForm}>
              Заполнить вручную
            </Button>
          </Space>
        ) : null}

        {step === 'form' || step === 'saving' ? (
          <>
            {recognizeError !== null ? (
              <Alert
                closable
                description="Заполните поля вручную или попробуйте другое фото."
                message={recognizeError}
                onClose={() => {
                  setRecognizeError(null);
                }}
                showIcon
                type="warning"
              />
            ) : null}

            <Form
              disabled={step === 'saving'}
              form={form}
              layout="vertical"
              onFinish={(values) => {
                void handleSubmit(values);
              }}
            >
              <PlantForm disabled={step === 'saving'} />

              <Space wrap>
                <Button
                  htmlType="submit"
                  loading={step === 'saving'}
                  type="primary"
                >
                  Сохранить
                </Button>
                <Button
                  disabled={step === 'saving'}
                  onClick={() => {
                    setStep('upload');
                    setRecognizeError(null);
                  }}
                >
                  Выбрать другое фото
                </Button>
              </Space>
            </Form>
          </>
        ) : null}
      </Space>
    </Spin>
  );
}
