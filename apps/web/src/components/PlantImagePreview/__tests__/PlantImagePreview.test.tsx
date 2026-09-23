import { renderUi } from '@test/render';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PlantImagePreview } from '../PlantImagePreview';

const frameOf = (): HTMLElement => {
  const frame = document.querySelector('.plant-image-preview-frame');

  expect(frame).toBeInstanceOf(HTMLElement);

  return frame as HTMLElement;
};

const pointerDown = (
  target: Element,
  x: number,
  y: number,
  button = 0,
): void => {
  fireEvent.pointerDown(target, {
    button,
    clientX: x,
    clientY: y,
    pointerId: 1,
  });
};

const pointerUp = (target: Element, x: number, y: number): void => {
  fireEvent.pointerUp(target, {
    clientX: x,
    clientY: y,
    pointerId: 1,
  });
};

const openPreview = async (): Promise<void> => {
  const user = userEvent.setup();

  await user.click(screen.getByRole('img', { name: 'Монстера' }));
  expect(await screen.findByRole('button', { name: 'Закрыть' })).toBeTruthy();
};

describe('PlantImagePreview', () => {
  it('рисует одно фото и набор с обложкой', () => {
    const single = renderUi(
      <PlantImagePreview alt="Монстера" src="/cover.jpg" />,
    );

    expect(single.container).toMatchSnapshot();
    single.unmount();

    const fromPreview = renderUi(
      <PlantImagePreview
        alt="Монстера"
        previewSrc="/original.jpg"
        src="/cover.jpg"
      />,
    );

    expect(fromPreview.container).toMatchSnapshot();
    fromPreview.unmount();

    const gallery = renderUi(
      <PlantImagePreview
        alt="Монстера"
        previewIndex={1}
        previewSrcs={['/a.jpg', '/b.jpg', '/c.jpg']}
        src="/cover.jpg"
      />,
    );

    expect(gallery.container).toMatchSnapshot();
  });

  it('листает фото кнопками, свайпом и ограничивает края', async () => {
    const user = userEvent.setup();

    renderUi(
      <PlantImagePreview
        alt="Монстера"
        previewSrcs={['/a.jpg', '/b.jpg', '/c.jpg']}
        src="/cover.jpg"
      />,
    );

    await openPreview();

    const prev = screen.getByRole('button', { name: 'Предыдущее фото' });
    const next = screen.getByRole('button', { name: 'Следующее фото' });

    expect(prev).toBeDisabled();

    fireEvent.mouseDown(next);
    await user.click(next);
    expect(prev).not.toBeDisabled();

    const frame = frameOf();

    pointerDown(frame, 10, 40);
    pointerUp(frame, 120, 40);

    pointerDown(frame, 0, 0, 2);
    pointerDown(prev, 0, 0);
    fireEvent.pointerUp(frame);
    fireEvent.pointerCancel(frame);

    pointerDown(frame, 20, 20);
    fireEvent.pointerCancel(frame);
    pointerUp(frame, 20, 20);

    pointerDown(frame, 50, 10);
    pointerUp(frame, 40, 120);

    await user.click(next);
    await user.click(next);
    expect(next).toBeDisabled();
  });

  it('листает назад и не уходит за край', async () => {
    const user = userEvent.setup();

    renderUi(
      <PlantImagePreview
        alt="Монстера"
        previewSrcs={['/a.jpg', '/b.jpg', '/c.jpg']}
        src="/cover.jpg"
      />,
    );

    await openPreview();

    const frame = frameOf();

    pointerDown(frame, 10, 40);
    pointerUp(frame, 120, 40);

    const prev = screen.getByRole('button', { name: 'Предыдущее фото' });

    expect(prev).toBeDisabled();

    const antdNext = document.querySelector('.ant-image-preview-switch-right');

    expect(antdNext).toBeInstanceOf(HTMLElement);
    fireEvent.click(antdNext as HTMLElement);
    expect(prev).not.toBeDisabled();

    await user.click(prev);
    expect(prev).toBeDisabled();
  });

  it('переключает оригинальный размер и закрывает просмотр', async () => {
    const user = userEvent.setup();

    renderUi(
      <PlantImagePreview
        alt="Монстера"
        previewSrcs={['/a.jpg', '/b.jpg']}
        src="/cover.jpg"
      />,
    );

    await openPreview();

    const frame = frameOf();

    pointerDown(frame, 40, 40);
    pointerUp(frame, 40, 40);
    pointerDown(frame, 48, 44);
    pointerUp(frame, 48, 44);

    expect(
      document.querySelector('.plant-image-preview-stage--original'),
    ).toBeTruthy();

    const capture = vi.spyOn(HTMLElement.prototype, 'setPointerCapture');

    pointerDown(frame, 40, 40);
    expect(capture).not.toHaveBeenCalled();
    capture.mockRestore();

    pointerDown(frame, 30, 30);
    pointerUp(frame, 30, 30);
    pointerDown(frame, 200, 200);
    pointerUp(frame, 200, 200);

    const stageImage = document.querySelector('.plant-image-preview-stage img');

    expect(stageImage).toBeTruthy();
    fireEvent.doubleClick(stageImage as Element);

    const nativeClose = document.querySelector(
      '.plant-image-preview .ant-image-preview-close',
    );

    expect(nativeClose).toBeInstanceOf(HTMLElement);

    const click = vi.spyOn(nativeClose as HTMLElement, 'click');

    fireEvent.mouseDown(screen.getByRole('button', { name: 'Закрыть' }));
    await user.click(screen.getByRole('button', { name: 'Закрыть' }));
    expect(click).toHaveBeenCalled();

    document
      .querySelector('.plant-image-preview .ant-image-preview-close')
      ?.remove();
    await user.click(screen.getByRole('button', { name: 'Закрыть' }));
  });

  it('глотает DOMException при захвате указателя', async () => {
    const capture = vi
      .spyOn(HTMLElement.prototype, 'setPointerCapture')
      .mockImplementation(() => {
        throw new DOMException('fail');
      });

    renderUi(
      <PlantImagePreview
        alt="Монстера"
        previewSrcs={['/a.jpg', '/b.jpg']}
        src="/cover.jpg"
      />,
    );

    await openPreview();
    pointerDown(frameOf(), 5, 5);
    capture.mockRestore();
  });

  it('одно фото не листается, смена индекса сбрасывает жест', async () => {
    const { rerender } = renderUi(
      <PlantImagePreview alt="Монстера" previewIndex={5} src="/only.jpg" />,
    );

    await openPreview();

    const frame = frameOf();

    pointerDown(frame, 0, 0);
    pointerUp(frame, -80, 0);

    rerender(
      <PlantImagePreview alt="Монстера" previewIndex={0} src="/only.jpg" />,
    );

    const close = document.querySelector(
      '.plant-image-preview .ant-image-preview-close',
    );

    expect(close).toBeInstanceOf(HTMLElement);
    fireEvent.click(close as HTMLElement);
  });
});
