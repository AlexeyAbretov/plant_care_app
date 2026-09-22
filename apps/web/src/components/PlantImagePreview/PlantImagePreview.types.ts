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

export type PreviewNavDirection = 'prev' | 'next';

export type PreviewNavButtonProps = {
  direction: PreviewNavDirection;
  disabled: boolean;
  onStep: () => void;
};

export type TapPoint = {
  time: number;
  x: number;
  y: number;
};
