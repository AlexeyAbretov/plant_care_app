import { describe, expect, it, vi } from 'vitest';

import { deferred, renderUi } from '@test';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DeletePlantButton } from '../DeletePlantButton';

describe('DeletePlantButton', () => {
  it('просит подтверждение и ждёт завершения удаления', async () => {
    const user = userEvent.setup();
    const pending = deferred<void>();
    const onConfirm = vi.fn(() => pending.promise);
    const { baseElement } = renderUi(
      <DeletePlantButton onConfirm={onConfirm} plantName="Монстера" />,
    );

    expect(baseElement).toMatchSnapshot();

    const trigger = screen.getByRole('button', { name: 'Удалить' });

    await user.click(trigger);
    expect(baseElement).toMatchSnapshot();

    const confirm = screen.getAllByRole('button', { name: 'Удалить' }).at(-1);

    expect(confirm).toBeDefined();

    await user.click(confirm as HTMLElement);
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(trigger).toHaveClass('ant-btn-loading');

    pending.resolve();

    await vi.waitFor(() => {
      expect(screen.getByRole('button', { name: 'Удалить' })).not.toHaveClass(
        'ant-btn-loading',
      );
    });
  });

  it('блокирует кнопку', () => {
    renderUi(
      <DeletePlantButton disabled onConfirm={vi.fn()} plantName="Монстера" />,
    );

    expect(screen.getByRole('button', { name: 'Удалить' })).toBeDisabled();
  });
});
