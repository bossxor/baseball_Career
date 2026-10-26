import { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import logo from '../../../docs/design/assets/brand/logo-mark.svg';
import { App } from './App.js';
import { readToken, signInForJwt, writeToken } from './auth-session.js';
import { createHttpApi } from './http.js';
import { Login } from './screens/Login.js';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing application root');

const apiBase = import.meta.env.VITE_API_BASE as string | undefined;
const authBase = import.meta.env.VITE_AUTH_BASE as string | undefined;
const defaultDev = (import.meta.env.VITE_DEV_TOKEN as string | undefined) ?? 'dev:local-web';

function Root() {
  const [token, setToken] = useState<string | null>(() => (apiBase ? readToken() : null));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const api = useMemo(() => {
    if (!apiBase || !token) return undefined;
    return createHttpApi({ baseUrl: apiBase, getToken: () => token });
  }, [token]);

  if (apiBase && !token) {
    return (
      <Login
        busy={busy}
        error={error}
        onDev={() => { writeToken(defaultDev); setToken(defaultDev); }}
        {...(authBase
          ? {
              onSubmit: (email: string, password: string) => {
                setBusy(true); setError(null);
                void signInForJwt({ authBaseUrl: authBase, email, password })
                  .then(jwt => { writeToken(jwt); setToken(jwt); })
                  .catch(() => setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인하세요.'))
                  .finally(() => setBusy(false));
              },
            }
          : {})}
      />
    );
  }

  return <App logo={logo} {...(api ? { api } : {})} />;
}

createRoot(root).render(<StrictMode><Root /></StrictMode>);
