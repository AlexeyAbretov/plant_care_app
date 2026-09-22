import '@ant-design/v5-patch-for-react-19';
import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { App } from './App';

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('Элемент #root не найден');
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
