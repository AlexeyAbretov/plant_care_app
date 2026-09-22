import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import {
  render,
  type RenderOptions,
  type RenderResult,
} from '@testing-library/react';

let currentPathname = '/';

const LocationTracker = (): null => {
  currentPathname = useLocation().pathname;

  return null;
};

export const pathname = (): string => currentPathname;

type RenderUiOptions = Omit<RenderOptions, 'wrapper'> & {
  path?: string;
  route?: string;
};

export const renderUi = (
  ui: React.ReactElement,
  options: RenderUiOptions = {},
): RenderResult => {
  const { path, route = '/', ...rest } = options;

  const wrapper = ({
    children,
  }: {
    children: React.ReactNode;
  }): React.JSX.Element => {
    const routed =
      path === undefined ? (
        children
      ) : (
        <Routes>
          <Route element={children} path={path} />
          <Route element={null} path="*" />
        </Routes>
      );

    return (
      <ConfigProvider locale={ruRU} theme={{ hashed: false }}>
        <MemoryRouter initialEntries={[route]}>
          <LocationTracker />
          {routed}
        </MemoryRouter>
      </ConfigProvider>
    );
  };

  return render(ui, { ...rest, wrapper });
};
