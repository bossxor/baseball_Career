import type { ReactNode } from 'react';
import { Illustration } from './assets/Illustration.js';
import type { SceneName } from './assets/Illustration.js';
import { SCREEN_TITLES, stateText } from './screen-states.js';
import type { ScreenId, ScreenState } from './screen-states.js';

/** S01 shows only failures: its saving/loading/conflict texts are internal notes (aria-busy only), never user copy. */
const HIDDEN_BANNERS: Readonly<Partial<Record<ScreenId, readonly ScreenState[]>>> = { S01: ['saving', 'loading', 'conflict'] };
export const bannerFor = (id: ScreenId, state: ScreenState): string | null => (HIDDEN_BANNERS[id]?.includes(state) ? null : state === 'empty' ? null : stateText(id, state));
export const isBusy = (state: ScreenState) => state === 'loading' || state === 'saving';

/** Which banner scene a screen shows; unknown screens fall back to the quiet one. */
const SCENES: Readonly<Partial<Record<ScreenId, SceneName>>> = {
  S01: 'hero', S02: 'school', S03: 'game', S04: 'school', S05: 'draft', S06: 'game', S07: 'game', S08: 'contract', S09: 'retire', S22: 'training', S23: 'training', S28: 'school',
  S12: 'club', S13: 'club', S14: 'club', S15: 'club', S16: 'club', S17: 'contract', S18: 'club', S19: 'game', S24: 'trophy', S25: 'trophy', S26: 'service', S27: 'service',
  S29: 'us', S30: 'us', S31: 'us', S32: 'us', S33: 'us', S34: 'college', S35: 'college', S36: 'pro', S37: 'contract', S38: 'training', S39: 'training', S40: 'trophy', S41: 'contract', S42: 'club', S43: 'club', S44: 'pro', S45: 'retire',
};
export const sceneFor = (id: ScreenId): SceneName => SCENES[id] ?? 'quiet';
/** Flow titles are served text; pick the scene by what the title talks about. */
export const flowScene = (title: string): SceneName =>
  /은퇴/.test(title) ? 'retire' : /미국/.test(title) ? 'us' : /대학/.test(title) ? 'college' : /KBO|프로|입단|포스트/.test(title) ? 'pro' : /계약|제안/.test(title) ? 'contract' : /훈련|캠프|재도전|학년/.test(title) ? 'training' : /고교|졸업/.test(title) ? 'school' : /시즌/.test(title) ? 'game' : 'quiet';
/** Empty state: small glove illustration above the text. */
export const Empty = ({ children }: { children: ReactNode }) => <div className="empty-state"><Illustration name="empty" /><p className="empty">{children}</p></div>;

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
      <Illustration name={sceneFor(id)} />
      <h1 id={titleId} className="screen-title">{SCREEN_TITLES[id]}</h1>
      {banner ? <p className={`banner banner-${state}`} role={state === 'error' || state === 'conflict' ? 'alert' : 'status'}>{banner}</p> : null}
      {state === 'error' ? <Illustration name="error" /> : null}
      {state === 'error' && onReload ? <Button onClick={onReload}>다시 시도</Button> : null}
      {state === 'conflict' && onReload ? <Button primary onClick={onReload}>최신 저장 불러오기</Button> : null}
      {children}
    </main>
  );
}

export function Button({ children, onClick, primary, danger, disabled, busy, type = 'button', describedBy }: {
  children: ReactNode; onClick?: (() => void) | undefined; primary?: boolean | undefined; danger?: boolean | undefined; disabled?: boolean | undefined; busy?: boolean | undefined; type?: 'button' | 'submit'; describedBy?: string | undefined;
}) {
  return <button type={type} className={primary ? 'btn primary' : danger ? 'btn danger' : 'btn'} onClick={onClick} disabled={disabled || busy} aria-busy={busy || undefined} aria-describedby={describedBy}>{children}</button>;
}
/** Error text sits next to the input it belongs to. */
export const FieldError = ({ id, message }: { id: string; message?: string | undefined }) => (message ? <p id={id} className="field-error" role="alert">{message}</p> : null);
