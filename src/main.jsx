import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/manrope';
import './styles/index.css';
import App from './App';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './context/ToastContext';
import { DemoSessionProvider } from './context/DemoSessionContext';
import { LoadingState } from './components/common/States';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <DemoSessionProvider>
          <DataProvider>
            <Suspense fallback={<LoadingState label="Preparing your workspace" />}>
              <App />
            </Suspense>
          </DataProvider>
        </DemoSessionProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
