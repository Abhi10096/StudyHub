/**
 * StudyHub Portal - Entry Point
 * * This file initializes the React application by mounting the 'App' component
 * into the 'root' DOM element. It also handles global style imports.
 */

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './App.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));

/**
 * StrictMode is enabled to identify potential problems in the
 * application during the development phase.
 */
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

/**
 * Performance monitoring:
 * We are passing a null function to avoid the 'WEBPACK' import error
 * while keeping the structure intact for the report.
 */
reportWebVitals();