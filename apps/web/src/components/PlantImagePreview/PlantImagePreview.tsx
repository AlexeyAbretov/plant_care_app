import { Image } from 'antd';
import type { CSSProperties } from 'react';

type PlantImagePreviewProps = {
  alt: string;
  src: string;
  previewSrc?: string;
  height?: number;
  width?: number;
  style?: CSSProperties;
};

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
