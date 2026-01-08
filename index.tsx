
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { StoreProvider } from './hooks/useStore.ts';
import { AuthProvider } from './hooks/useAuth.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <StoreProvider children={<App />} />
    </AuthProvider>
  </React.StrictMode>
);
