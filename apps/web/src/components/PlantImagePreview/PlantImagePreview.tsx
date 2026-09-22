import './PlantImagePreview.css';

import { Image } from 'antd';
import { cloneElement, useEffect, useRef, useState } from 'react';

import { CloseOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';

import type {
  PlantImagePreviewProps,
  PreviewNavButtonProps,
  PreviewNavDirection,
  TapPoint,
} from './PlantImagePreview.types';

const SWIPE_THRESHOLD_PX = 50;
const DOUBLE_TAP_MS = 400;
const DOUBLE_TAP_DISTANCE_PX = 30;

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

const isSwipe = (deltaX: number, deltaY: number): boolean => {
  return (
    Math.abs(deltaX) >= SWIPE_THRESHOLD_PX &&
    Math.abs(deltaX) > Math.abs(deltaY)
  );
};

const isDoubleTap = (
  previous: TapPoint | null,
  x: number,
  y: number,
  time: number,
): boolean => {
  if (previous === null) {
    return false;
  }

  const dx = x - previous.x;
  const dy = y - previous.y;
  const limit = DOUBLE_TAP_DISTANCE_PX * DOUBLE_TAP_DISTANCE_PX;

  return time - previous.time <= DOUBLE_TAP_MS && dx * dx + dy * dy <= limit;
};

const stageClassName = (originalSize: boolean): string => {
  if (!originalSize) {
    return 'plant-image-preview-stage';
  }

  return 'plant-image-preview-stage plant-image-preview-stage--original';
};

const navClassName = (direction: PreviewNavDirection): string => {
  return `plant-image-preview-nav plant-image-preview-nav--${direction}`;
};

const blockPreviewZoom = (event: React.MouseEvent<HTMLImageElement>): void => {
  event.preventDefault();
  event.stopPropagation();
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

const PreviewNavButton = ({
  direction,
  disabled,
  onStep,
}: PreviewNavButtonProps): React.JSX.Element => {
  const label = direction === 'prev' ? 'Предыдущее фото' : 'Следующее фото';

  return (
    <button
      aria-label={label}
      className={navClassName(direction)}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onStep();
      }}
      onMouseDown={stopMouseDown}
      type="button"
    >
      {direction === 'prev' ? <LeftOutlined /> : <RightOutlined />}
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
  const [originalSize, setOriginalSize] = useState(false);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const lastTap = useRef<TapPoint | null>(null);
  const imageStyle = {
    cursor: 'pointer',
    objectFit: style?.objectFit ?? 'contain',
    ...style,
  };
  const sizeTitle = originalSize
    ? 'Двойной клик — стандартный размер'
    : 'Двойной клик — оригинальный размер';

  useEffect(() => {
    setCurrent(coverIndex);
  }, [coverIndex]);

  const resetGesture = (): void => {
    swipeStart.current = null;
    lastTap.current = null;
  };

  const goTo = (index: number): void => {
    const next = stepPreview(index, 0, sources.length);

    if (next === current) {
      return;
    }

    resetGesture();
    setOriginalSize(false);
    setCurrent(next);
  };

  const onPreviewPointerDown = (
    event: React.PointerEvent<HTMLSpanElement>,
  ): void => {
    if (event.button !== 0 || isControlTarget(event.target)) {
      return;
    }

    swipeStart.current = { x: event.clientX, y: event.clientY };

    if (!originalSize) {
      capturePointer(event.currentTarget, event.pointerId);
    }
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

    if (!originalSize && isSwipe(deltaX, deltaY) && sources.length > 1) {
      event.stopPropagation();
      lastTap.current = null;
      goTo(current + (deltaX < 0 ? 1 : -1));

      return;
    }

    if (
      Math.abs(deltaX) >= SWIPE_THRESHOLD_PX ||
      Math.abs(deltaY) >= SWIPE_THRESHOLD_PX
    ) {
      lastTap.current = null;

      return;
    }

    const now = Date.now();

    if (isDoubleTap(lastTap.current, event.clientX, event.clientY, now)) {
      event.stopPropagation();
      lastTap.current = null;
      setOriginalSize((value) => !value);

      return;
    }

    lastTap.current = { time: now, x: event.clientX, y: event.clientY };
  };

  const onPreviewPointerCancel = (): void => {
    swipeStart.current = null;
  };

  const renderPreview = (original: React.ReactElement): React.ReactElement => {
    const image = cloneElement(original, {
      onDoubleClick: blockPreviewZoom,
      title: sizeTitle,
    });

    return (
      <span className="plant-image-preview-shell">
        <span
          className="plant-image-preview-frame"
          onPointerCancel={onPreviewPointerCancel}
          onPointerDown={onPreviewPointerDown}
          onPointerUp={onPreviewPointerUp}
        >
          <span className={stageClassName(originalSize)}>{image}</span>
        </span>
        {sources.length > 1 ? (
          <PreviewNavButton
            direction="prev"
            disabled={current === 0}
            onStep={() => {
              goTo(current - 1);
            }}
          />
        ) : null}
        {sources.length > 1 ? (
          <PreviewNavButton
            direction="next"
            disabled={current === sources.length - 1}
            onStep={() => {
              goTo(current + 1);
            }}
          />
        ) : null}
        <PreviewCloseButton />
      </span>
    );
  };

  return (
    <Image.PreviewGroup
      items={sources}
      preview={{
        current,
        imageRender: renderPreview,
        movable: false,
        onChange: (next) => {
          goTo(next);
        },
        onVisibleChange: (open) => {
          resetGesture();
          setOriginalSize(false);

          if (open) {
            setCurrent(coverIndex);
          }
        },
        rootClassName: 'plant-image-preview',
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
