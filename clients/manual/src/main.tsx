import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ManualGameApp } from './app/ManualGameApp';
import './styles/reset.css';
import './styles/tokens.css';
import './styles/stage.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ManualGameApp />
  </StrictMode>,
);
