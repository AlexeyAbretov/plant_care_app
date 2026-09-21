import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import dayjs from 'dayjs';
import { Route, Routes } from 'react-router-dom';

import { AppLayout } from '@components';
import { WeatherWidgetContainer } from '@containers';
import { WeatherProvider } from '@hooks';
import { AddPage, CatalogPage, EditPlantPage } from '@pages';

dayjs.locale('ru');

export const App = (): React.JSX.Element => {
  return (
    <ConfigProvider locale={ruRU}>
      <WeatherProvider>
        <AppLayout headerExtra={<WeatherWidgetContainer />}>
          <Routes>
            <Route path="/" element={<CatalogPage />} />
            <Route path="/add" element={<AddPage />} />
            <Route path="/plants/:id/edit" element={<EditPlantPage />} />
          </Routes>
        </AppLayout>
      </WeatherProvider>
    </ConfigProvider>
  );
};
