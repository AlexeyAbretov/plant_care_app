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

  const handleRecognize = async (): Promise<void> => {
    if (imageFile === null) {
      message.error('Загрузите фото растения');

      return;
    }

    setRecognizeError(null);
    setStep('recognizing');

    try {
      const result = await plantsApi.recognize(imageFile);

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

  const handleSubmit = async (values: PlantFormValues): Promise<void> => {
    if (imageFile === null) {
      message.error('Загрузите фото растения');

      return;
    }

    setSaveError(null);
    setStep('saving');

    try {
      await plantsApi.create(mapFormValuesToPayload(values), imageFile);
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
          previewOriginalUrl={previewUrl}
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
                  void handleRecognize();
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
                <PlantConditionButton
                  assess={() => plantsApi.assessCondition(imageFile!)}
                  disabled={imageFile === null}
                  disabledTooltip="Сначала загрузите фото"
                />
                <Button
                  disabled={step === 'saving'}
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
