import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/manrope';
import './styles/index.css';
import App from './App';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './context/ToastContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <DataProvider>
          <Suspense fallback={null}>
            <App />
          </Suspense>
        </DataProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
