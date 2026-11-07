import { forwardRef, useEffect, useRef, useState } from 'react';
import { Empty, Button, flowScene, isBusy } from '../ui.js';
import { Illustration } from '../assets/Illustration.js';
import { stateText } from '../screen-states.js';
import type { ScreenState } from '../screen-states.js';
import type { FlowCommand, FlowView } from '../model.js';
import { SeasonReview } from './SeasonReview.js';
import { RetirementSummary } from './RetirementSummary.js';

export interface FlowProps {
  view: FlowView | null; state?: ScreenState;
  onCommand?: (command: FlowCommand) => void; onBack?: () => void; onReload?: () => void;
}
/** 진로·재도전 흐름. Buttons are exactly the commands the server offered; a command with `confirm` needs a second, explicit tap. */
export function Flow({ view, state = 'ready', onCommand, onBack, onReload }: FlowProps) {
  const [asking, setAsking] = useState<string | null>(null), [signing, setSigning] = useState<string | null>(null);
  const busy = isBusy(state), banner = state === 'ready' || state === 'empty' ? null : stateText('S03', state);
  const pending = view?.commands.find(c => c.id === asking), signCmd = view?.commands.find(c => c.id === signing && c.sign), confirmRef = useRef<HTMLElement>(null), signRef = useRef<HTMLElement>(null);
  // Move focus into the confirmation so keyboard and screen-reader users land on the question.
  useEffect(() => { if (pending) confirmRef.current?.focus(); }, [pending]);
  useEffect(() => { if (signCmd) signRef.current?.focus(); }, [signCmd]);
  return (
    <main className="screen" aria-labelledby="flow-title" aria-busy={busy} data-screen="FLOW" data-state={state}>
      <header className="topbar">{onBack ? <button type="button" className="ghost" onClick={onBack}>커리어로</button> : <span />}</header>
      <Illustration name={flowScene(view?.title ?? '')} />
      <h1 id="flow-title" className="screen-title">{view?.title ?? '진행'}</h1>
      {banner ? <p className={`banner banner-${state}`} role={state === 'error' || state === 'conflict' ? 'alert' : 'status'}>{banner}</p> : null}
      {state === 'conflict' && onReload ? <Button primary onClick={onReload}>최신 저장 불러오기</Button> : null}
      {view ? (
        <>
          {view.seasonReview ? <SeasonReview review={view.seasonReview} /> : null}
          {view.retirementSummary ? <RetirementSummary summary={view.retirementSummary} /> : null}
          {view.lines.length ? (
            <section className="panel" aria-label="현재 상태">
              <dl className="flow-lines">{view.lines.map(l => <div key={`${l.label}:${l.value}`}><dt>{l.label}</dt><dd>{l.value}</dd></div>)}</dl>
            </section>
          ) : null}
          {view.notice ? <p className="notice-card" role="status">{view.notice}</p> : null}
          {signCmd?.sign ? (
            <SignCard ref={signRef} name={signCmd.sign.name} label={signCmd.label} busy={busy} onSign={() => { setSigning(null); onCommand?.(signCmd); }} onCancel={() => setSigning(null)} />
          ) : pending ? (
            <section ref={confirmRef} tabIndex={-1} className="confirm-card" role="alertdialog" aria-labelledby="flow-confirm" aria-describedby="flow-confirm">
              <Illustration name="warn" />
              <p id="flow-confirm"><strong>{pending.confirm}</strong></p>
              <div className="actions">
                <Button danger busy={busy} onClick={() => { setAsking(null); onCommand?.(pending); }}>{pending.label}</Button>
                <Button onClick={() => setAsking(null)}>취소</Button>
              </div>
            </section>
          ) : (
            <div className="actions" role="group" aria-label="다음 행동">
              {view.commands.map((c, i) => (
                <div key={c.id} className="cmd">
                  <Button primary={i === 0 && !c.confirm} busy={busy} describedBy={c.facts?.length ? `facts-${c.id}` : undefined} onClick={() => (c.confirm ? setAsking(c.id) : c.sign ? setSigning(c.id) : onCommand?.(c))}>{c.label}</Button>
                  {c.facts?.length ? <dl id={`facts-${c.id}`} className="cmd-facts">{c.facts.map(f => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}</dl> : null}
                </div>
              ))}
              {view.commands.length === 0 ? <Empty>지금 선택할 수 있는 행동이 없습니다.</Empty> : null}
            </div>
          )}
        </>
      ) : state === 'ready' ? <Empty>진행할 단계를 찾지 못했습니다. 커리어 화면으로 돌아가세요.</Empty> : null}
    </main>
  );
}

/** Display-only signing step before a contract command: signing sends the unchanged command once; nothing is stored or added to the payload. */
const SignCard = forwardRef<HTMLElement, { name: string; label: string; busy: boolean; onSign: () => void; onCancel: () => void }>(function SignCard({ name, label, busy, onSign, onCancel }, ref) {
  const canvas = useRef<HTMLCanvasElement>(null), [drawn, setDrawn] = useState(false), last = useRef<{ x: number; y: number } | null>(null);
  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => { const r = e.currentTarget.getBoundingClientRect(); return { x: (e.clientX - r.left) * (e.currentTarget.width / r.width), y: (e.clientY - r.top) * (e.currentTarget.height / r.height) }; };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvas.current?.getContext('2d'), p = pos(e); if (!last.current || !ctx) return;
    ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = '#1b2430'; ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last.current = p; setDrawn(true);
  };
  const clear = () => { const c = canvas.current; c?.getContext('2d')?.clearRect(0, 0, c.width, c.height); setDrawn(false); };
  return (
    <section ref={ref} tabIndex={-1} className="sign-card" aria-labelledby="sign-title">
      <p id="sign-title"><strong>{label}</strong> 전에 서명해 주세요. 서명은 확인용이며 기록되지 않습니다.</p>
      <Button primary busy={busy} onClick={onSign}>{name} 이름으로 서명</Button>
      <p className="muted">또는 손으로 서명 (선택)</p>
      <canvas ref={canvas} className="sign-pad" width={600} height={160} role="img" aria-label="손글씨 서명 영역"
        onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); last.current = pos(e); }} onPointerMove={move} onPointerUp={() => { last.current = null; }} onPointerCancel={() => { last.current = null; }} />
      <div className="actions">
        <Button busy={busy} disabled={!drawn} onClick={onSign}>손글씨로 서명</Button>
        <Button onClick={clear} disabled={!drawn}>지우기</Button>
        <Button onClick={onCancel}>취소</Button>
      </div>
    </section>
  );
});
