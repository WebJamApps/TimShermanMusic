/**
 * @file Main.tsx
 * @description Entry point for Tim Sherman Music web application.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from 'src/App';

import { DataProvider } from 'src/providers/Data.provider';
import { AuthProvider } from 'src/providers/Auth.provider';
import 'src/index.css';

const container = document.getElementById('root');

if (container) {
  createRoot(container).render(
    <StrictMode>
      <AuthProvider>
        <DataProvider>
          <App />
        </DataProvider>
      </AuthProvider>
    </StrictMode>,
  );
}

