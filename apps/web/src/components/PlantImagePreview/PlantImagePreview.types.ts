import type { CSSProperties } from 'react';

export type PlantImagePreviewProps = {
  alt: string;
  src: string;
  previewSrc?: string;
  height?: number;
  width?: number;
  style?: CSSProperties;
};
