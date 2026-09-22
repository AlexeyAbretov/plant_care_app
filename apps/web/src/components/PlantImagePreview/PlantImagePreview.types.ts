import type { CSSProperties } from 'react';

export type PlantImagePreviewProps = {
  alt: string;
  src: string;
  previewSrc?: string;
  previewSrcs?: string[];
  previewIndex?: number;
  height?: number;
  width?: number;
  style?: CSSProperties;
};
