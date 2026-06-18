import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/tokens.css';
import './index.css';
import App from './App.jsx';
import { initServiceWorker } from './sw-register.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

initServiceWorker();
