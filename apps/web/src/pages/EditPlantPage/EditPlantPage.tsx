import { Alert, Button, Form, message, Space, Spin, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { apiClient, ApiError, plantsApi } from '@api';
import {
  DeletePlantButton,
  ImageUpload,
  mapFormValuesToPayload,
  mapPlantToFormValues,
  PlantConditionButton,
  PlantForm,
  type PlantFormValues,
  RetryAlert,
} from '@components';
import type { Plant } from '@types';

import type { EditStep } from './EditPlantPage.types';

export const EditPlantPage = (): React.JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm<PlantFormValues>();
  const [step, setStep] = useState<EditStep>('loading');
  const [plant, setPlant] = useState<Plant | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (id === undefined) {
      setStep('notFound');

      return;
    }

    let cancelled = false;

    const loadPlant = async (): Promise<void> => {
      setStep('loading');

      try {
        const loadedPlant = await plantsApi.get(id!);

        if (cancelled) {
          return;
        }

        setPlant(loadedPlant);
        form.setFieldsValue(mapPlantToFormValues(loadedPlant));
        setStep('form');
      } catch (error: unknown) {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiError && error.status === 404) {
          setStep('notFound');

          return;
        }

        setLoadError(
          error instanceof ApiError
            ? error.message
            : 'Не удалось загрузить растение',
        );
        setStep('error');
      }
    };

    void loadPlant();

    return () => {
      cancelled = true;
    };
  }, [form, id]);

  useEffect(() => {
    if (imageFile === null) {
      setPreviewUrl(plant !== null ? apiClient.url(plant.thumbnailUrl) : null);

      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);

    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile, plant]);

  const handleSubmit = async (values: PlantFormValues): Promise<void> => {
    if (id === undefined || plant === null) {
      return;
    }

    setSaveError(null);
    setStep('saving');

    try {
      await plantsApi.update(
        id,
        mapFormValuesToPayload(values),
        imageFile ?? undefined,
      );
      message.success('Растение обновлено');
      navigate('/');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : 'Не удалось обновить растение';

      setSaveError(errorMessage);
      setStep('form');
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (id === undefined) {
      return;
    }

    try {
      await plantsApi.delete(id);
      message.success('Растение удалено');
      navigate('/');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : 'Не удалось удалить растение';

      message.error(errorMessage);
    }
  };

  if (step === 'loading') {
    return <Spin tip="Загружаем растение…" />;
  }

  if (step === 'notFound') {
    return (
      <Space direction="vertical" size="large">
        <Typography.Title level={3} style={{ marginTop: 0 }}>
          Растение не найдено
        </Typography.Title>
        <Link to="/">Вернуться в каталог</Link>
      </Space>
    );
  }

  if (step === 'error') {
    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Alert message={loadError} showIcon type="error" />
        <Link to="/">Вернуться в каталог</Link>
      </Space>
    );
  }

  const isBusy = step === 'saving';

  return (
    <Spin spinning={isBusy} tip="Сохраняем изменения…">
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Редактировать растение
      </Typography.Title>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Space align="start" wrap>
          <ImageUpload
            disabled={isBusy}
            file={imageFile}
            onFileSelect={setImageFile}
            previewOriginalUrl={
              imageFile !== null
                ? previewUrl
                : plant !== null
                  ? apiClient.url(plant.imageUrl)
                  : null
            }
            previewUrl={previewUrl}
          />
          <PlantConditionButton
            assess={() =>
              imageFile !== null
                ? plantsApi.assessCondition(imageFile)
                : plantsApi.assessConditionById(id!)
            }
          />
        </Space>

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
            retryLoading={isBusy}
            showIcon
            type="error"
          />
        ) : null}

        <Form
          disabled={isBusy}
          form={form}
          layout="vertical"
          onFinish={(values) => {
            void handleSubmit(values);
          }}
        >
          <PlantForm disabled={isBusy} />

          <Space wrap>
            <Button htmlType="submit" loading={isBusy} type="primary">
              Сохранить
            </Button>
            <Button disabled={isBusy} onClick={() => navigate('/')}>
              Отмена
            </Button>
            {plant !== null ? (
              <DeletePlantButton
                disabled={isBusy}
                onConfirm={handleDelete}
                plantName={plant.name}
              />
            ) : null}
          </Space>
        </Form>
      </Space>
    </Spin>
  );
};
