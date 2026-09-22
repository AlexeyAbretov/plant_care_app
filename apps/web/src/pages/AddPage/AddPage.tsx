import { Button, Form, message, Space, Spin, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ApiError, plantsApi } from '@api';
import {
  ImageUpload,
  mapFormValuesToPayload,
  PlantConditionButton,
  PlantForm,
  type PlantFormValues,
  RetryAlert,
} from '@components';
import type { PlantRecognizeResult } from '@types';
import { todayIsoDate } from '@utils';

import type { AddStep } from './AddPage.types';

const getDefaultFormValues = (): PlantFormValues => {
  const today = todayIsoDate();

  return {
    name: '',
    description: '',
    category: '',
    lightPreference: '',
    sizeInfo: '',
    locationKind: 'indoor',
    wateringNotes: '',
    fertilizingNotes: '',
    lastWateredAt: today,
    lastFertilizedAt: today,
  };
};

const mapRecognizeToFormValues = (
  result: PlantRecognizeResult,
): PlantFormValues => {
  const today = todayIsoDate();

  return {
    ...result,
    locationKind: 'indoor',
    lastWateredAt: today,
    lastFertilizedAt: today,
  };
};

export const AddPage = (): React.JSX.Element => {
  const navigate = useNavigate();
  const [form] = Form.useForm<PlantFormValues>();
  const [step, setStep] = useState<AddStep>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recognizeError, setRecognizeError] = useState<string | null>(null);
  const [recognizeWithName, setRecognizeWithName] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  const openManualForm = (): void => {
    setRecognizeError(null);
    setSaveError(null);
    form.setFieldsValue(getDefaultFormValues());
    setStep('form');
  };

  const handleRecognize = async (file: File): Promise<void> => {
    setRecognizeWithName(false);
    setRecognizeError(null);
    setStep('recognizing');

    try {
      const result = await plantsApi.recognize(file);

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
  };

  const recognizeByName = async (file: File): Promise<void> => {
    const name = String(form.getFieldValue('name') ?? '').trim();
    const current = form.getFieldsValue();

    setRecognizeWithName(true);
    setRecognizeError(null);
    setIsRecognizing(true);

    try {
      const result = await plantsApi.recognize(file, name);

      form.setFieldsValue({
        ...mapRecognizeToFormValues(result),
        lastFertilizedAt: current.lastFertilizedAt || todayIsoDate(),
        lastWateredAt: current.lastWateredAt || todayIsoDate(),
        locationKind: current.locationKind ?? 'indoor',
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : 'Не удалось распознать растение';

      setRecognizeError(errorMessage);
    } finally {
      setIsRecognizing(false);
    }
  };

  const handleSubmit = async (
    file: File,
    values: PlantFormValues,
  ): Promise<void> => {
    setSaveError(null);
    setStep('saving');

    try {
      await plantsApi.create(mapFormValuesToPayload(values), file);
      message.success('Растение сохранено');
      navigate('/');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : 'Не удалось сохранить растение';

      setSaveError(errorMessage);
      setStep('form');
    }
  };

  const isBusy = step === 'recognizing' || step === 'saving' || isRecognizing;
  const formLocked = step === 'saving' || isRecognizing;

  return (
    <Spin
      spinning={step === 'recognizing' || isRecognizing}
      tip="Распознаём растение…"
    >
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Добавить растение
      </Typography.Title>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <ImageUpload
          disabled={isBusy || step === 'form'}
          file={imageFile}
          onFileSelect={setImageFile}
          previewOriginalUrl={previewUrl}
          previewUrl={previewUrl}
        />

        {step === 'upload' ? (
          <Space wrap>
            <Button
              disabled={imageFile === null}
              onClick={
                imageFile === null
                  ? undefined
                  : () => {
                      void handleRecognize(imageFile);
                    }
              }
              type="primary"
            >
              Распознать растение
            </Button>
            <Button disabled={imageFile === null} onClick={openManualForm}>
              Заполнить вручную
            </Button>
          </Space>
        ) : null}

        {imageFile !== null && (step === 'form' || step === 'saving') ? (
          <>
            {recognizeError !== null ? (
              <RetryAlert
                closable
                description={
                  'Повторите распознавание или заполните поля вручную.'
                }
                message={recognizeError}
                onClose={() => {
                  setRecognizeError(null);
                }}
                onRetry={() => {
                  if (recognizeWithName) {
                    void recognizeByName(imageFile);

                    return;
                  }

                  void handleRecognize(imageFile);
                }}
                retryDisabled={step === 'saving'}
                showIcon
                type="warning"
              />
            ) : null}

            {saveError !== null ? (
              <RetryAlert
                closable
                message={saveError}
                onClose={() => {
                  setSaveError(null);
                }}
                onRetry={() => {
                  form.submit();
                }}
                retryLoading={step === 'saving'}
                showIcon
                type="error"
              />
            ) : null}

            <Form
              disabled={formLocked}
              form={form}
              layout="vertical"
              onFinish={(values) => {
                void handleSubmit(imageFile, values);
              }}
            >
              <PlantForm
                disabled={formLocked}
                onRecognize={() => {
                  void recognizeByName(imageFile);
                }}
                recognizeLoading={isRecognizing}
              />

              <Space wrap>
                <Button
                  htmlType="submit"
                  loading={step === 'saving'}
                  type="primary"
                >
                  Сохранить
                </Button>
                <PlantConditionButton
                  assess={() => plantsApi.assessCondition(imageFile)}
                  disabled={formLocked}
                />
                <Button
                  disabled={formLocked}
                  onClick={() => {
                    setStep('upload');
                    setRecognizeError(null);
                    setSaveError(null);
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
};
