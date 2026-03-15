import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { installGlobalTracking } from '../../src/runtime/client.ts';
import { DemoErrorBoundary } from './errorBoundary';

installGlobalTracking();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DemoErrorBoundary>
      <App />
    </DemoErrorBoundary>
  </React.StrictMode>
);
