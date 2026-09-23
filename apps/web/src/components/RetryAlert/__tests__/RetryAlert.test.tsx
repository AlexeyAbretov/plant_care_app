import { describe, expect, it, vi } from 'vitest';

import { renderUi } from '@test';
import { fireEvent, screen } from '@testing-library/react';

import { RetryAlert } from '../RetryAlert';

describe('RetryAlert', () => {
  it('рисует ошибку с описанием и предупреждение без него', () => {
    const onRetry = vi.fn();
    const onClose = vi.fn();
    const error = renderUi(
      <RetryAlert
        closable
        description="Повторите позже"
        message="Не удалось загрузить"
        onClose={onClose}
        onRetry={onRetry}
        retryLoading
        showIcon
        type="error"
      />,
    );

    expect(error.container).toMatchSnapshot();
    error.unmount();

    const actionable = renderUi(
      <RetryAlert
        closable
        description="Повторите позже"
        message="Не удалось загрузить"
        onClose={onClose}
        onRetry={onRetry}
        showIcon
        type="error"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(onRetry).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'close' }));
    expect(onClose).toHaveBeenCalledOnce();
    actionable.unmount();

    const warning = renderUi(
      <RetryAlert
        message="Проверьте фото"
        onRetry={vi.fn()}
        retryDisabled
        type="warning"
      />,
    );

    expect(warning.container).toMatchSnapshot();
    expect(screen.getByRole('button', { name: 'Повторить' })).toBeDisabled();
  });
});
