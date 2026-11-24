import { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import logo from '../../../docs/design/assets/brand/logo-mark.svg';
import { App } from './App.js';
import { clearToken, readToken, signInForJwt, writeToken } from './auth-session.js';
import { createHttpApi } from './http.js';
import { createLocalApi } from './local-api.js';
import { Login } from './screens/Login.js';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing application root');

const apiBase = import.meta.env.VITE_API_BASE as string | undefined;
const authBase = import.meta.env.VITE_AUTH_BASE as string | undefined;
const defaultDev = (import.meta.env.VITE_DEV_TOKEN as string | undefined) ?? 'dev:local-web';
const localApi = Capacitor.getPlatform() === 'android' ? createLocalApi() : null;

function Root() {
  const [cloud, setCloud] = useState(!localApi);
  const [token, setToken] = useState<string | null>(() => (apiBase ? readToken() : null));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const api = useMemo(() => {
    if (!apiBase || !token) return undefined;
    return createHttpApi({ baseUrl: apiBase, getToken: () => token, onUnauthorized: () => { clearToken(); setToken(null); } });
  }, [token]);
  const deviceBackups = useMemo(() => {
    if (!localApi || !cloud || !apiBase || !token) return undefined;
    return {
      listDevice: async () => (await localApi.home()).saves,
      listAccount: () => localApi.accountBackups(apiBase, token),
      upload: (saveId: string) => localApi.backupToAccount(apiBase, token, saveId),
      restore: (backupId: string) => localApi.restoreAccountBackup(apiBase, token, backupId),
    };
  }, [cloud, token]);

  const switchStorage = (nextCloud: boolean) => {
    location.hash = '#/';
    setError(null);
    setCloud(nextCloud);
  };
  if (localApi && !cloud) {
    return <App key="device" logo={logo} api={localApi} {...(apiBase ? { onStorageSwitch: () => switchStorage(true), storageSwitchLabel: '계정 저장 열기' } : {})} />;
  }
  if (apiBase && !token) {
    return (
      <Login
        busy={busy}
        error={error}
        {...(localApi ? { onBack: () => switchStorage(false) } : {})}
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

  return <App key="cloud" logo={logo} {...(api ? { api } : {})}
    {...(deviceBackups ? { deviceBackups } : {})}
    {...(localApi ? { onStorageSwitch: () => switchStorage(false), storageSwitchLabel: '이 기기 게임' } : {})}
    {...(localApi && apiBase && token ? { onCopySave: (saveId: string) => localApi.copyFromAccount(apiBase, token, saveId) } : {})} />;
}

createRoot(root).render(<StrictMode><Root /></StrictMode>);
