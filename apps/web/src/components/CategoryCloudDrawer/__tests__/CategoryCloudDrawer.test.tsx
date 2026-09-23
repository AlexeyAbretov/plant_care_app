import { describe, expect, it, vi } from 'vitest';

import { renderUi } from '@test';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CategoryCloudDrawer } from '../CategoryCloudDrawer';

const options = ['Алоэ', 'Пальмы'];

describe('CategoryCloudDrawer', () => {
  it('во встроенной панели отмечает и снимает категории', async () => {
    const user = userEvent.setup();
    const onCategoriesChange = vi.fn();
    const view = renderUi(
      <CategoryCloudDrawer
        categories={['Алоэ']}
        categoryOptions={options}
        embedded
        onCategoriesChange={onCategoriesChange}
        onOpenChange={vi.fn()}
        open
      />,
    );

    expect(view.container).toMatchSnapshot();

    await user.click(screen.getByText('Пальмы'));
    expect(onCategoriesChange).toHaveBeenCalledWith(['Алоэ', 'Пальмы']);

    await user.click(screen.getByText('Алоэ'));
    expect(onCategoriesChange).toHaveBeenLastCalledWith([]);

    const palm = screen.getByText('Пальмы');

    fireEvent.mouseEnter(palm.parentElement ?? palm);
    fireEvent.mouseLeave(palm.parentElement ?? palm);
  });

  it('не меняет выбор выключенной панели и прячется', async () => {
    const user = userEvent.setup();
    const onCategoriesChange = vi.fn();
    const disabled = renderUi(
      <CategoryCloudDrawer
        categories={[]}
        categoryOptions={options}
        disabled
        embedded
        onCategoriesChange={onCategoriesChange}
        onOpenChange={vi.fn()}
        open
      />,
    );

    await user.click(screen.getByText('Алоэ'));
    expect(onCategoriesChange).not.toHaveBeenCalled();
    disabled.unmount();

    const closed = renderUi(
      <CategoryCloudDrawer
        categories={[]}
        categoryOptions={options}
        embedded
        onCategoriesChange={vi.fn()}
        onOpenChange={vi.fn()}
        open={false}
      />,
    );

    expect(
      screen.queryByRole('complementary', { name: 'Фильтр по категориям' }),
    ).toBeNull();
    closed.unmount();

    const empty = renderUi(
      <CategoryCloudDrawer
        categories={[]}
        categoryOptions={[]}
        embedded
        onCategoriesChange={vi.fn()}
        onOpenChange={vi.fn()}
        open
      />,
    );

    expect(empty.container).toMatchSnapshot();
  });

  it('закрывает выезжающую панель', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { baseElement } = renderUi(
      <CategoryCloudDrawer
        categories={[]}
        categoryOptions={options}
        onCategoriesChange={vi.fn()}
        embedded={false}
        onOpenChange={onOpenChange}
        open
      />,
    );

    expect(baseElement).toMatchSnapshot();

    const close = baseElement.querySelector('.ant-drawer-close');

    expect(close).toBeInstanceOf(HTMLElement);

    await user.click(close as HTMLElement);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
