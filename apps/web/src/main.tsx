import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import logo from '../../../docs/design/assets/brand/logo-mark.svg';
import { App } from './App.js';
import { createHttpApi } from './http.js';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing application root');

const base = import.meta.env.VITE_API_BASE as string | undefined;
const token = (import.meta.env.VITE_DEV_TOKEN as string | undefined) ?? 'dev:local-web';
const api = base ? createHttpApi({ baseUrl: base, getToken: () => token }) : undefined;

createRoot(root).render(
  <StrictMode>
    <App logo={logo} {...(api ? { api } : {})} />
  </StrictMode>,
);
