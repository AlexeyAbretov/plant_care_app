import { describe, expect, it, vi } from 'vitest';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createPlant, deferred } from '../../../test/fixtures';
import { renderUi } from '../../../test/render';
import { PlantCard } from '../PlantCard';

const asyncNoop = (): Promise<void> => Promise.resolve();

describe('PlantCard', () => {
  it('рисует карточку и карточку с поправкой на отопление', () => {
    const plain = renderUi(
      <PlantCard
        imageSrc="/thumb.jpg"
        onAssess={vi.fn()}
        onDelete={asyncNoop}
        onFertilize={asyncNoop}
        onWater={asyncNoop}
        plant={createPlant()}
        previewSrcs={['/full.jpg']}
        wateringClimate={null}
      />,
    );

    expect(plain.container).toMatchSnapshot();
    plain.unmount();

    const adjusted = renderUi(
      <PlantCard
        imageSrc="/thumb.jpg"
        onAssess={vi.fn()}
        onDelete={asyncNoop}
        onFertilize={asyncNoop}
        onWater={asyncNoop}
        plant={createPlant()}
        previewIndex={0}
        previewSrcs={['/full.jpg', '/side.jpg']}
        wateringClimate={{
          heat: false,
          heatingSeason: true,
          overcast: false,
          precipitationLikely: false,
        }}
      />,
    );

    expect(adjusted.container).toMatchSnapshot();
    expect(screen.getByText(/отопление/)).toBeTruthy();
  });

  it('отмечает полив, подкормку, оценку и удаление', async () => {
    const user = userEvent.setup();
    const water = deferred<void>();
    const fertilize = deferred<void>();
    const onWater = vi.fn(() => water.promise);
    const onFertilize = vi.fn(() => fertilize.promise);
    const onDelete = vi.fn(asyncNoop);
    const onAssess = vi.fn().mockResolvedValue({
      assessment: 'Норма',
      healthLevel: 'good' as const,
      recommendations: ['Держать на свету'],
    });

    renderUi(
      <PlantCard
        imageSrc="/thumb.jpg"
        onAssess={onAssess}
        onDelete={onDelete}
        onFertilize={onFertilize}
        onWater={onWater}
        plant={createPlant()}
        previewSrcs={['/full.jpg']}
        wateringClimate={null}
      />,
    );

    const waterButton = screen.getByRole('button', { name: 'Полил сегодня' });

    await user.click(waterButton);
    expect(waterButton).toHaveClass('ant-btn-loading');
    water.resolve();

    await user.click(screen.getByRole('button', { name: 'Подкормил сегодня' }));
    fertilize.resolve();

    await user.click(screen.getByRole('button', { name: 'Состояние' }));
    expect(await screen.findByText('Норма')).toBeTruthy();
    expect(onAssess).toHaveBeenCalledWith('plant-1');

    await user.click(screen.getByRole('button', { name: 'Удалить' }));
    const confirm = screen.getAllByRole('button', { name: 'Удалить' }).at(-1);

    await user.click(confirm as HTMLElement);
    expect(onDelete).toHaveBeenCalledWith('plant-1');
    expect(onWater).toHaveBeenCalledWith('plant-1');
    expect(onFertilize).toHaveBeenCalledWith('plant-1');
  });
});
