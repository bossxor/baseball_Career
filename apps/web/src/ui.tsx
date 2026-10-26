import type { ReactNode } from 'react';
import { SCREEN_TITLES, stateText } from './screen-states.js';
import type { ScreenId, ScreenState } from './screen-states.js';

/** S01 shows only failures: its saving/loading/conflict texts are internal notes (aria-busy only), never user copy. */
const HIDDEN_BANNERS: Readonly<Partial<Record<ScreenId, readonly ScreenState[]>>> = { S01: ['saving', 'loading', 'conflict'] };
export const bannerFor = (id: ScreenId, state: ScreenState): string | null => (HIDDEN_BANNERS[id]?.includes(state) ? null : state === 'empty' ? null : stateText(id, state));
export const isBusy = (state: ScreenState) => state === 'loading' || state === 'saving';

export interface FrameProps {
  id: ScreenId; state?: ScreenState; saveLabel?: string;
  onBack?: (() => void) | undefined; onReload?: (() => void) | undefined; children: ReactNode;
}
/** Common structure (17): top bar (back / save state) → title → state banner → content. Content is kept while loading;
 * only confirming controls are disabled by the screens through `isBusy`. */
export function ScreenFrame({ id, state = 'ready', saveLabel, onBack, onReload, children }: FrameProps) {
  const banner = bannerFor(id, state), busy = isBusy(state), titleId = `${id}-title`;
  return (
    <main className="screen" aria-labelledby={titleId} aria-busy={busy} data-screen={id} data-state={state}>
      <header className="topbar">
        {onBack ? <button type="button" className="ghost" onClick={onBack}>뒤로</button> : <span />}
        {saveLabel ? <span className="save-state" role="status">{saveLabel}</span> : null}
      </header>
      <h1 id={titleId} className="screen-title">{SCREEN_TITLES[id]}</h1>
      {banner ? <p className={`banner banner-${state}`} role={state === 'error' || state === 'conflict' ? 'alert' : 'status'}>{banner}</p> : null}
      {state === 'conflict' && onReload ? <Button primary onClick={onReload}>최신 저장 불러오기</Button> : null}
      {children}
    </main>
  );
}

export function Button({ children, onClick, primary, disabled, busy, type = 'button', describedBy }: {
  children: ReactNode; onClick?: (() => void) | undefined; primary?: boolean | undefined; disabled?: boolean | undefined; busy?: boolean | undefined; type?: 'button' | 'submit'; describedBy?: string | undefined;
}) {
  return <button type={type} className={primary ? 'btn primary' : 'btn'} onClick={onClick} disabled={disabled || busy} aria-busy={busy || undefined} aria-describedby={describedBy}>{children}</button>;
}
/** Error text sits next to the input it belongs to. */
export const FieldError = ({ id, message }: { id: string; message?: string | undefined }) => (message ? <p id={id} className="field-error" role="alert">{message}</p> : null);
