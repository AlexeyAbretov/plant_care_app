import { Image } from 'antd';

import type { PlantImagePreviewProps } from './PlantImagePreview.types';

export const PlantImagePreview = ({
  alt,
  src,
  previewSrc,
  height,
  width,
  style,
}: PlantImagePreviewProps): React.JSX.Element => {
  const previewUrl = previewSrc ?? src;

  return (
    <Image
      alt={alt}
      height={height}
      preview={{
        src: previewUrl,
      }}
      src={src}
      style={{
        cursor: 'pointer',
        objectFit: style?.objectFit ?? 'contain',
        ...style,
      }}
      title="Нажмите для просмотра"
      width={width}
    />
  );
};
