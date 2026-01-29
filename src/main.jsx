import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'
import { ensureDevSession } from "./lib/devAuth";

async function bootstrap() {
  if (import.meta.env.DEV) {
    await ensureDevSession();
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap();

