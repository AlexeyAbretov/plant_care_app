import { pathname, renderUi } from '@test/render';
import { describe, expect, it } from 'vitest';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AppLayout } from '../AppLayout';

describe('AppLayout', () => {
  it('подсвечивает каталог, добавление и редактирование', () => {
    const routes = ['/', '/add', '/plants/plant-1/edit', '/missing'];

    for (const route of routes) {
      const view = renderUi(
        <AppLayout>
          <p>{route}</p>
        </AppLayout>,
        { route },
      );

      expect(view.container).toMatchSnapshot();
      view.unmount();
    }
  });

  it('рисует слот шапки и переходит в добавление', async () => {
    const user = userEvent.setup();
    const { container } = renderUi(
      <AppLayout headerExtra={<span>Погода</span>}>
        <p>Контент</p>
      </AppLayout>,
    );

    expect(container).toMatchSnapshot();

    await user.click(screen.getByRole('link', { name: 'Добавить' }));

    expect(pathname()).toBe('/add');
  });
});
