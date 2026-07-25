import React from 'react';
import ReactDOM from 'react-dom/client';
import './tailwind-compiled.css';
import App from './App';
import { setupAuth } from './setupAuth';

setupAuth();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
