import { useState } from 'react';
import { Button, FieldError } from '../ui.js';

export interface LoginProps {
  busy?: boolean;
  error?: string | null;
  onSubmit?: (email: string, password: string) => void;
  onDev?: () => void;
}
/** Minimal gate when `VITE_API_BASE` is set. Dev bearer is available when Auth URL is absent. */
export function Login({ busy = false, error = null, onSubmit, onDev }: LoginProps) {
  const [email, setEmail] = useState(''), [password, setPassword] = useState('');
  return (
    <main className="screen" data-screen="LOGIN" aria-labelledby="login-title">
      <h1 id="login-title" className="screen-title">다시, 플레이볼</h1>
      <p className="lead"><span>계정으로 이어서 합니다.</span></p>
      <form className="panel" onSubmit={e => { e.preventDefault(); onSubmit?.(email.trim(), password); }} noValidate>
        <div className="field">
          <label htmlFor="login-email">이메일</label>
          <input id="login-email" type="email" autoComplete="username" value={email} disabled={busy}
            onChange={e => setEmail(e.target.value)} aria-invalid={error ? true : undefined} aria-describedby="login-error" />
        </div>
        <div className="field">
          <label htmlFor="login-password">비밀번호</label>
          <input id="login-password" type="password" autoComplete="current-password" value={password} disabled={busy}
            onChange={e => setPassword(e.target.value)} aria-describedby="login-error" />
        </div>
        <FieldError id="login-error" message={error ?? undefined} />
        <Button type="submit" primary busy={busy} disabled={!email.trim() || !password}>로그인</Button>
      </form>
      {onDev ? <Button busy={busy} onClick={onDev}>개발 토큰으로 계속</Button> : null}
    </main>
  );
}
