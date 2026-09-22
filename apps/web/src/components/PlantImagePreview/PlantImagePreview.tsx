import './PlantImagePreview.css';

import { Image } from 'antd';
import { useEffect, useRef, useState } from 'react';

import { CloseOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';

import type { PlantImagePreviewProps } from './PlantImagePreview.types';

const SWIPE_THRESHOLD_PX = 50;

const isControlTarget = (target: EventTarget | null): boolean => {
  return target instanceof Element && target.closest('button') !== null;
};

const capturePointer = (element: HTMLElement, pointerId: number): void => {
  try {
    element.setPointerCapture(pointerId);
  } catch (error) {
    if (!(error instanceof DOMException)) {
      throw error;
    }
  }
};

const stepPreview = (
  current: number,
  offset: number,
  total: number,
): number => {
  return Math.min(Math.max(current + offset, 0), total - 1);
};

const closePreview = (event: React.MouseEvent<HTMLButtonElement>): void => {
  event.stopPropagation();

  const closeButton = document.querySelector(
    '.plant-image-preview .ant-image-preview-close',
  );

  if (closeButton instanceof HTMLElement) {
    closeButton.click();
  }
};

const stopMouseDown = (event: React.MouseEvent<HTMLButtonElement>): void => {
  event.stopPropagation();
};

const PreviewCloseButton = (): React.JSX.Element => {
  return (
    <button
      aria-label="Закрыть"
      className="plant-image-preview-close"
      onClick={closePreview}
      onMouseDown={stopMouseDown}
      type="button"
    >
      <CloseOutlined />
    </button>
  );
};

export const PlantImagePreview = ({
  alt,
  src,
  previewSrc,
  previewSrcs,
  previewIndex = 0,
  height,
  width,
  style,
}: PlantImagePreviewProps): React.JSX.Element => {
  const sources =
    previewSrcs !== undefined && previewSrcs.length > 0
      ? previewSrcs
      : [previewSrc ?? src];
  const coverIndex = Math.min(Math.max(previewIndex, 0), sources.length - 1);
  const [current, setCurrent] = useState(coverIndex);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const imageStyle = {
    cursor: 'pointer',
    objectFit: style?.objectFit ?? 'contain',
    ...style,
  };

  useEffect(() => {
    setCurrent(coverIndex);
  }, [coverIndex]);

  const onPreviewPointerDown = (
    event: React.PointerEvent<HTMLSpanElement>,
  ): void => {
    if (event.button !== 0 || isControlTarget(event.target)) {
      return;
    }

    swipeStart.current = { x: event.clientX, y: event.clientY };
    capturePointer(event.currentTarget, event.pointerId);
  };

  const onPreviewPointerUp = (
    event: React.PointerEvent<HTMLSpanElement>,
  ): void => {
    const start = swipeStart.current;

    swipeStart.current = null;

    if (start === null) {
      return;
    }

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;

    if (
      Math.abs(deltaX) < SWIPE_THRESHOLD_PX ||
      Math.abs(deltaX) <= Math.abs(deltaY)
    ) {
      return;
    }

    event.stopPropagation();
    setCurrent((index) => {
      return stepPreview(index, deltaX < 0 ? 1 : -1, sources.length);
    });
  };

  if (sources.length <= 1) {
    return (
      <Image
        alt={alt}
        height={height}
        preview={{
          imageRender: (original) => (
            <span className="plant-image-preview-stage">
              {original}
              <PreviewCloseButton />
            </span>
          ),
          rootClassName: 'plant-image-preview',
          src: sources[0],
        }}
        src={src}
        style={imageStyle}
        title="Нажмите для просмотра"
        width={width}
      />
    );
  }

  return (
    <Image.PreviewGroup
      items={sources}
      preview={{
        current,
        onChange: (next) => {
          setCurrent(next);
        },
        onVisibleChange: (open) => {
          if (open) {
            setCurrent(coverIndex);
          }
        },
        movable: false,
        rootClassName: 'plant-image-preview',
        imageRender: (original) => (
          <span
            className="plant-image-preview-stage"
            onPointerDown={onPreviewPointerDown}
            onPointerUp={onPreviewPointerUp}
          >
            {original}
            <button
              aria-label="Предыдущее фото"
              className="plant-image-preview-nav plant-image-preview-nav--prev"
              disabled={current === 0}
              onClick={(event) => {
                event.stopPropagation();
                setCurrent((index) => stepPreview(index, -1, sources.length));
              }}
              onMouseDown={(event) => {
                event.stopPropagation();
              }}
              type="button"
            >
              <LeftOutlined />
            </button>
            <button
              aria-label="Следующее фото"
              className="plant-image-preview-nav plant-image-preview-nav--next"
              disabled={current === sources.length - 1}
              onClick={(event) => {
                event.stopPropagation();
                setCurrent((index) => stepPreview(index, 1, sources.length));
              }}
              onMouseDown={(event) => {
                event.stopPropagation();
              }}
              type="button"
            >
              <RightOutlined />
            </button>
            <PreviewCloseButton />
          </span>
        ),
      }}
    >
      <Image
        alt={alt}
        height={height}
        preview={{ src: sources[coverIndex] }}
        src={src}
        style={imageStyle}
        title="Нажмите для просмотра"
        width={width}
      />
    </Image.PreviewGroup>
  );
};
