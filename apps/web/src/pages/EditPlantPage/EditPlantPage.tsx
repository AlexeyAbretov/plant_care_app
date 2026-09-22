import { Alert, Button, Form, message, Space, Spin, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { apiClient, ApiError, plantsApi } from '@api';
import {
  DeletePlantButton,
  mapFormValuesToPayload,
  mapPlantToFormValues,
  PlantForm,
  type PlantFormValues,
  PlantImageGallery,
  RetryAlert,
} from '@components';
import type { Plant } from '@types';

import type { EditPlantFormProps, EditStep } from './EditPlantPage.types';

const EditPlantForm = ({
  disabled,
  onCancel,
  onCloseError,
  onDelete,
  onSubmit,
  plant,
  saveError,
}: EditPlantFormProps): React.JSX.Element => {
  const [form] = Form.useForm<PlantFormValues>();

  return (
    <>
      {saveError !== null ? (
        <RetryAlert
          closable
          message={saveError}
          onClose={onCloseError}
          onRetry={() => {
            form.submit();
          }}
          retryLoading={disabled}
          showIcon
          type="error"
        />
      ) : null}

      <Form
        disabled={disabled}
        form={form}
        initialValues={mapPlantToFormValues(plant)}
        layout="vertical"
        onFinish={(values) => {
          void onSubmit(values);
        }}
      >
        <PlantForm disabled={disabled} />

        <Space wrap>
          <Button htmlType="submit" loading={disabled} type="primary">
            Сохранить
          </Button>
          <Button disabled={disabled} onClick={onCancel}>
            Отмена
          </Button>
          <DeletePlantButton
            disabled={disabled}
            onConfirm={onDelete}
            plantName={plant.name}
          />
        </Space>
      </Form>
    </>
  );
};

export const EditPlantPage = (): React.JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState<EditStep>('loading');
  const [plant, setPlant] = useState<Plant | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
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
  }, [id]);

  const handleSubmit = async (values: PlantFormValues): Promise<void> => {
    if (id === undefined || plant === null) {
      return;
    }

    setSaveError(null);
    setStep('saving');

    try {
      await plantsApi.update(id, mapFormValuesToPayload(values));
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

  const showImageError = (error: unknown, fallback: string): void => {
    const errorMessage = error instanceof ApiError ? error.message : fallback;

    message.error(errorMessage);
  };

  const handleAddImages = async (files: File[]): Promise<void> => {
    if (id === undefined) {
      return;
    }

    try {
      const updated = await plantsApi.addImages(id, files);

      setPlant(updated);
      message.success(files.length > 1 ? 'Фото добавлены' : 'Фото добавлено');
    } catch (error: unknown) {
      showImageError(error, 'Не удалось добавить фото');
    }
  };

  const handleDeleteImage = async (imageId: string): Promise<void> => {
    if (id === undefined) {
      return;
    }

    try {
      const updated = await plantsApi.deleteImage(id, imageId);

      setPlant(updated);
      message.success('Фото удалено');
    } catch (error: unknown) {
      showImageError(error, 'Не удалось удалить фото');
    }
  };

  const handleSetDefault = async (imageId: string | null): Promise<void> => {
    if (id === undefined) {
      return;
    }

    try {
      const updated = await plantsApi.setDefaultImage(id, imageId);

      setPlant(updated);
      message.success(
        imageId === null
          ? 'На плитке снова последнее фото'
          : 'Фото по умолчанию обновлено',
      );
    } catch (error: unknown) {
      showImageError(error, 'Не удалось обновить фото по умолчанию');
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
    return (
      <Spin tip="Загружаем растение…">
        <div style={{ minHeight: 120 }} />
      </Spin>
    );
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
        {plant !== null ? (
          <PlantImageGallery
            disabled={isBusy}
            images={plant.images.map((image) => {
              return {
                id: image.id,
                src: apiClient.url(image.thumbnailUrl),
                previewSrc: apiClient.url(image.imageUrl),
                isDefault: image.isDefault,
                isCover: image.isCover,
              };
            })}
            onAddFiles={handleAddImages}
            onAssess={(imageId) => {
              return plantsApi.assessConditionByImageId(id!, imageId);
            }}
            onDelete={handleDeleteImage}
            onSetDefault={handleSetDefault}
          />
        ) : null}

        {plant !== null ? (
          <EditPlantForm
            disabled={isBusy}
            onCancel={() => {
              navigate('/');
            }}
            onCloseError={() => {
              setSaveError(null);
            }}
            onDelete={handleDelete}
            onSubmit={handleSubmit}
            plant={plant}
            saveError={saveError}
          />
        ) : null}
      </Space>
    </Spin>
  );
};
