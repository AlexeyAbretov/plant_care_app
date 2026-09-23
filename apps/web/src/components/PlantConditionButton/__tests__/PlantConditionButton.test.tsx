import { describe, expect, it, vi } from 'vitest';

import { conditionResult, deferred, renderUi } from '@test';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PlantConditionButton } from '../PlantConditionButton';

describe('PlantConditionButton', () => {
  it('показывает ошибку, повтор и успешную оценку', async () => {
    const user = userEvent.setup();
    const assess = vi
      .fn()
      .mockRejectedValueOnce(new Error('Модель занята'))
      .mockRejectedValueOnce('x')
      .mockResolvedValueOnce(conditionResult());
    const { baseElement } = renderUi(<PlantConditionButton assess={assess} />);

    expect(baseElement).toMatchSnapshot();

    await user.click(screen.getByRole('button', { name: 'Состояние' }));
    expect(await screen.findByText('Модель занята')).toBeTruthy();
    expect(baseElement).toMatchSnapshot();

    await user.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(
      await screen.findByText('Не удалось оценить состояние растения'),
    ).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Проверить снова' }));
    expect(await screen.findByText('Хорошее')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Закрыть' }));
    expect(assess).toHaveBeenCalledTimes(3);
  });

  it('не закрывается во время оценки и ставит запасной текст', async () => {
    const user = userEvent.setup();
    const pending = deferred<ReturnType<typeof conditionResult>>();
    const assess = vi
      .fn()
      .mockReturnValueOnce(pending.promise)
      .mockRejectedValueOnce(new Error(''))
      .mockResolvedValueOnce(
        conditionResult({ healthLevel: 'fair', recommendations: [] }),
      );
    const { baseElement } = renderUi(<PlantConditionButton assess={assess} />);

    await user.click(screen.getByRole('button', { name: 'Состояние' }));
    expect(baseElement.querySelector('.ant-spin')).toBeTruthy();

    const dismiss = baseElement.querySelector('.ant-modal-close');

    expect(dismiss).toBeInstanceOf(HTMLElement);
    await user.click(dismiss as HTMLElement);
    expect(screen.getByRole('dialog')).toBeTruthy();

    pending.resolve(conditionResult({ healthLevel: 'poor' }));
    expect(await screen.findByText('Требует внимания')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Закрыть' }));

    await user.click(screen.getByRole('button', { name: 'Состояние' }));
    expect(
      await screen.findByText('Не удалось оценить состояние растения'),
    ).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Проверить снова' }));
    expect(await screen.findByText('Удовлетворительное')).toBeTruthy();
  });

  it('показывает подсказку у выключенной кнопки', () => {
    const withTip = renderUi(
      <PlantConditionButton
        assess={vi.fn()}
        disabled
        disabledTooltip="Сначала загрузите фото"
      />,
    );

    expect(withTip.baseElement).toMatchSnapshot();
    withTip.unmount();

    renderUi(<PlantConditionButton assess={vi.fn()} disabled />);

    expect(screen.getByRole('button', { name: 'Состояние' })).toBeDisabled();
  });
});
