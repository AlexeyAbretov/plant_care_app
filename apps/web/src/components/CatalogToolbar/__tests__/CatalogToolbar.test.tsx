import { describe, expect, it, vi } from 'vitest';

import { renderUi } from '@test';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CatalogToolbar } from '../CatalogToolbar';

describe('CatalogToolbar', () => {
  it('переключает категории и сортировку', async () => {
    const user = userEvent.setup();
    const onCategoriesDrawerOpenChange = vi.fn();
    const onSortChange = vi.fn();
    const { container } = renderUi(
      <CatalogToolbar
        categoriesDrawerOpen={false}
        onCategoriesDrawerOpenChange={onCategoriesDrawerOpenChange}
        onSortChange={onSortChange}
        sort="watering"
      />,
    );

    expect(container).toMatchSnapshot();

    await user.click(
      screen.getByRole('button', { name: 'Показать категории' }),
    );
    expect(onCategoriesDrawerOpenChange).toHaveBeenCalledWith(true);

    fireEvent.click(screen.getByText('По подкормке'));
    expect(onSortChange).toHaveBeenCalledWith('fertilizing');
  });

  it('рисует открытый фильтр и блокирует действия', () => {
    const { container } = renderUi(
      <CatalogToolbar
        categoriesDrawerOpen
        disabled
        onCategoriesDrawerOpenChange={vi.fn()}
        onSortChange={vi.fn()}
        sort="fertilizing"
      />,
    );

    expect(container).toMatchSnapshot();
    expect(
      screen.getByRole('button', { name: 'Скрыть категории' }),
    ).toBeDisabled();
  });
});
