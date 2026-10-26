import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import logo from '../../../docs/design/assets/brand/logo-mark.svg';
import { App } from './App.js';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing application root');
createRoot(root).render(<StrictMode><App logo={logo} /></StrictMode>);
