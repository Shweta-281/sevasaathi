import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App.jsx';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './i18n.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary><BrowserRouter>
      <App />
      <Toaster position="top-right" richColors closeButton />
    </BrowserRouter></ErrorBoundary>
  </React.StrictMode>
);
