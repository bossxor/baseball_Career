import { defineConfig } from 'vite';

// React's automatic JSX runtime is supplied by TypeScript/esbuild; no compiler plugin needed for M0.
const proxy = { '/api': { target: process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:3001' } };
export default defineConfig({ server: { proxy }, preview: { proxy } });
