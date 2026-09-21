import { message, Upload, type UploadProps } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';

import { InboxOutlined } from '@ant-design/icons';

import { PlantImagePreview } from '../PlantImagePreview';

const { Dragger } = Upload;

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

type ImageUploadProps = {
  file: File | null;
  previewUrl: string | null;
  previewOriginalUrl?: string | null;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
};

function validateImageFile(file: File): string | null {
  if (
    !ALLOWED_IMAGE_TYPES.includes(
      file.type as (typeof ALLOWED_IMAGE_TYPES)[number],
    )
  ) {
    return 'Допустимы только JPEG, PNG и WebP';
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return 'Размер файла не должен превышать 5 МБ';
  }

  return null;
}

export function ImageUpload({
  file,
  previewUrl,
  previewOriginalUrl,
  onFileSelect,
  disabled = false,
}: ImageUploadProps): React.JSX.Element {
  const uploadProps: UploadProps = {
    accept: ALLOWED_IMAGE_TYPES.join(','),
    disabled,
    fileList: file
      ? ([
          {
            uid: '-1',
            name: file.name,
            status: 'done',
          },
        ] satisfies UploadFile[])
      : [],
    maxCount: 1,
    beforeUpload: (nextFile) => {
      const validationError = validateImageFile(nextFile);

      if (validationError !== null) {
        message.error(validationError);

        return Upload.LIST_IGNORE;
      }

      onFileSelect(nextFile);

      return false;
    },
    onRemove: () => {
      onFileSelect(null);
    },
    showUploadList: { showRemoveIcon: !disabled },
  };

  return (
    <div>
      <Dragger {...uploadProps}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Нажмите или перетащите фото растения</p>
        <p className="ant-upload-hint">JPEG, PNG или WebP, до 5 МБ</p>
      </Dragger>
      {previewUrl !== null ? (
        <PlantImagePreview
          alt="Предпросмотр"
          previewSrc={previewOriginalUrl ?? previewUrl}
          src={previewUrl}
          style={{
            display: 'block',
            marginTop: 16,
            maxHeight: 240,
            maxWidth: '100%',
          }}
        />
      ) : null}
    </div>
  );
}
