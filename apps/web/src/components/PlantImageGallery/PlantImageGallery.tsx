import './PlantImageGallery.css';

import { Button, message, Popconfirm, Tooltip, Typography, Upload } from 'antd';
import { useState } from 'react';

import type { PlantImageGalleryProps } from './PlantImageGallery.types';
import { getImageValidationError } from './PlantImageGallery.utils';

import { ALLOWED_IMAGE_TYPES } from '../ImageUpload';
import { PlantConditionButton } from '../PlantConditionButton';
import { PlantImagePreview } from '../PlantImagePreview';

export const PlantImageGallery = ({
  images,
  disabled = false,
  onAddFiles,
  onDelete,
  onSetDefault,
  onAssess,
}: PlantImageGalleryProps): React.JSX.Element => {
  const [busy, setBusy] = useState(false);
  const locked = disabled || busy;
  const canRemove = images.length > 1;

  const run = async (action: () => Promise<void>): Promise<void> => {
    setBusy(true);

    try {
      await action();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="plant-image-gallery">
      <Typography.Paragraph type="secondary">
        На плитке каталога показывается фото по умолчанию или последнее
        загруженное. В превью плитки можно листать все фото.
      </Typography.Paragraph>
      <div className="plant-image-gallery__list">
        {images.map((image) => {
          const deleteButton = (
            <Button danger disabled={locked || !canRemove} block>
              Удалить
            </Button>
          );

          return (
            <div className="plant-image-gallery__item" key={image.id}>
              <PlantImagePreview
                alt="Фото растения"
                height={128}
                previewSrc={image.previewSrc}
                src={image.src}
                style={{ borderRadius: 8, objectFit: 'cover' }}
                width={128}
              />
              <div className="plant-image-gallery__actions">
                {canRemove ? (
                  <Button
                    disabled={locked}
                    onClick={() => {
                      void run(() =>
                        onSetDefault(image.isDefault ? null : image.id),
                      );
                    }}
                    type={image.isDefault ? 'primary' : 'default'}
                  >
                    {image.isDefault ? 'Сбросить' : 'По умолчанию'}
                  </Button>
                ) : null}
                <PlantConditionButton
                  assess={() => onAssess(image.id)}
                  disabled={locked}
                />
                {canRemove ? (
                  <Popconfirm
                    cancelText="Отмена"
                    description="Фото пропадёт из галереи."
                    disabled={locked}
                    okButtonProps={{ danger: true }}
                    okText="Удалить"
                    onConfirm={() => {
                      void run(() => onDelete(image.id));
                    }}
                    title="Удалить фото?"
                  >
                    {deleteButton}
                  </Popconfirm>
                ) : (
                  <Tooltip title="Должно остаться хотя бы одно фото">
                    <span>{deleteButton}</span>
                  </Tooltip>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <Upload
        accept={ALLOWED_IMAGE_TYPES.join(',')}
        beforeUpload={(file, fileList) => {
          const last = fileList[fileList.length - 1];

          if (file.uid !== last?.uid) {
            return Upload.LIST_IGNORE;
          }

          const accepted: File[] = [];

          for (const item of fileList) {
            const error = getImageValidationError(item);

            if (error !== null) {
              message.error(`${item.name}: ${error}`);
            } else {
              accepted.push(item);
            }
          }

          if (accepted.length > 0) {
            void run(() => onAddFiles(accepted));
          }

          return Upload.LIST_IGNORE;
        }}
        disabled={locked}
        multiple
        showUploadList={false}
      >
        <Button disabled={locked} loading={busy}>
          Добавить фото
        </Button>
      </Upload>
    </div>
  );
};
