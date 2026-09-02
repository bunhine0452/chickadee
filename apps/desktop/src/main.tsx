import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './styles/tokens.css';
import './styles/reset.css';
import './styles/fonts.css';
import './styles/physics.css';
import './styles/app.css';

import { App } from './App.js';
import { boot } from './boot.js';

const el = document.getElementById('root');
if (!el) throw new Error('#root 이 없다');

createRoot(el).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

void boot();
