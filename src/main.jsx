// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { store, persistor } from '@/store/index';
import App from '@/App';
import '@/styles/global.scss';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background:   'var(--color-bg-elevated)',
                color:        'var(--color-text-primary)',
                border:       '1px solid var(--color-bg-border)',
                borderRadius: 'var(--radius-md)',
                fontFamily:   'var(--font-body)',
                fontSize:     '0.875rem',
              },
              success: { iconTheme: { primary: 'var(--color-accent)', secondary: 'var(--color-bg-base)' } },
              error:   { iconTheme: { primary: 'var(--color-danger)', secondary: 'var(--color-bg-base)' } },
              duration: 4000,
            }}
          />
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);