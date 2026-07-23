// Intercept all fetch requests globally to rewrite the hardcoded localhost API URL dynamically
// based on the environment variables defined in the .env file.
const originalFetch = window.fetch;
window.fetch = function (input, init) {
  let url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : null);
  if (url) {
    const API_URL = import.meta.env.NEXT_PUBLIC_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:8082';
    if (url.startsWith('http://localhost:8082')) {
      url = url.replace('http://localhost:8082', API_URL);
    } else if (url.startsWith('/')) {
      url = `${API_URL}${url}`;
    }
    
    if (typeof input === 'string') {
      input = url;
    } else if (input instanceof URL) {
      input = new URL(url);
    } else if (input instanceof Request) {
      input = new Request(url, input);
    }
  }
  return originalFetch(input, init);
};

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
