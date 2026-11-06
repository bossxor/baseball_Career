import { useEffect, useRef, useState } from 'react';
import { Button, isBusy } from '../ui.js';
import { stateText } from '../screen-states.js';
import type { ScreenState } from '../screen-states.js';
import type { FlowCommand, FlowView } from '../model.js';

export interface FlowProps {
  view: FlowView | null; state?: ScreenState;
  onCommand?: (command: FlowCommand) => void; onBack?: () => void; onReload?: () => void;
}
/** 진로·재도전 흐름. Buttons are exactly the commands the server offered; a command with `confirm` needs a second, explicit tap. */
export function Flow({ view, state = 'ready', onCommand, onBack, onReload }: FlowProps) {
  const [asking, setAsking] = useState<string | null>(null);
  const busy = isBusy(state), banner = state === 'ready' || state === 'empty' ? null : stateText('S03', state);
  const pending = view?.commands.find(c => c.id === asking), confirmRef = useRef<HTMLElement>(null);
  // Move focus into the confirmation so keyboard and screen-reader users land on the question.
  useEffect(() => { if (pending) confirmRef.current?.focus(); }, [pending]);
  return (
    <main className="screen" aria-labelledby="flow-title" aria-busy={busy} data-screen="FLOW" data-state={state}>
      <header className="topbar">{onBack ? <button type="button" className="ghost" onClick={onBack}>커리어로</button> : <span />}</header>
      <h1 id="flow-title" className="screen-title">{view?.title ?? '진행'}</h1>
      {banner ? <p className={`banner banner-${state}`} role={state === 'error' || state === 'conflict' ? 'alert' : 'status'}>{banner}</p> : null}
      {state === 'conflict' && onReload ? <Button primary onClick={onReload}>최신 저장 불러오기</Button> : null}
      {view ? (
        <>
          {view.lines.length ? (
            <section className="panel" aria-label="현재 상태">
              <dl className="flow-lines">{view.lines.map(l => <div key={`${l.label}:${l.value}`}><dt>{l.label}</dt><dd>{l.value}</dd></div>)}</dl>
            </section>
          ) : null}
          {view.notice ? <p className="notice-card" role="status">{view.notice}</p> : null}
          {pending ? (
            <section ref={confirmRef} tabIndex={-1} className="confirm-card" role="alertdialog" aria-labelledby="flow-confirm" aria-describedby="flow-confirm">
              <p id="flow-confirm"><strong>{pending.confirm}</strong></p>
              <div className="actions">
                <Button danger busy={busy} onClick={() => { setAsking(null); onCommand?.(pending); }}>{pending.label}</Button>
                <Button onClick={() => setAsking(null)}>취소</Button>
              </div>
            </section>
          ) : (
            <div className="actions" role="group" aria-label="다음 행동">
              {view.commands.map((c, i) => (
                <Button key={c.id} primary={i === 0 && !c.confirm} busy={busy} onClick={() => (c.confirm ? setAsking(c.id) : onCommand?.(c))}>{c.label}</Button>
              ))}
              {view.commands.length === 0 ? <p className="empty">지금 선택할 수 있는 행동이 없습니다.</p> : null}
            </div>
          )}
        </>
      ) : state === 'ready' ? <p className="empty">진행할 단계를 찾지 못했습니다. 커리어 화면으로 돌아가세요.</p> : null}
    </main>
  );
}
