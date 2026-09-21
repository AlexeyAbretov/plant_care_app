import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import dayjs from 'dayjs';
import { Route, Routes } from 'react-router-dom';

import { AppLayout } from './components';
import { AddPage, CatalogPage, EditPlantPage } from './pages';

dayjs.locale('ru');

export function App(): React.JSX.Element {
  return (
    <ConfigProvider locale={ruRU}>
      <AppLayout>
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/add" element={<AddPage />} />
          <Route path="/plants/:id/edit" element={<EditPlantPage />} />
        </Routes>
      </AppLayout>
    </ConfigProvider>
  );
}
