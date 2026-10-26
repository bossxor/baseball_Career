import { ScreenFrame, Button, isBusy } from '../ui.js';
import { stateText } from '../screen-states.js';
import type { ScreenState } from '../screen-states.js';
import { PROGRESS_LABELS } from '../model.js';
import type { CareerView, ProgressMode } from '../model.js';

export interface CareerProps {
  view: CareerView | null; state?: ScreenState; mode?: ProgressMode;
  onMode?: (mode: ProgressMode) => void; onAction?: (actionId: string, mode: ProgressMode) => void; onBack?: () => void; onReload?: () => void;
}
/** S03 커리어. Buttons come only from `nextActions`; the progress mode defaults to "다음 주요 사건까지". A pending event
 * leaves the event action as the only primary one (no advance past it). */
export function Career({ view, state = 'ready', mode, onMode, onAction, onBack, onReload }: CareerProps) {
  const busy = isBusy(state);
  const frame = { ...(onBack ? { onBack } : {}), ...(onReload ? { onReload } : {}) };
  if (!view) {
    return <ScreenFrame id="S03" state={state} {...frame}><p className="empty">{stateText('S03', 'empty')}</p></ScreenFrame>;
  }
  const current = mode ?? view.progress.mode, modes: readonly ProgressMode[] = [view.progress.mode, ...view.progress.alternatives];
  return (
    <ScreenFrame id="S03" state={state} {...frame}>
      <section className="panel" aria-label="선수">
        <h2>{view.protagonist.name}</h2>
        <p>{view.protagonist.kindLabel} · {view.protagonist.positionLabel} · {view.protagonist.ageLabel}</p>
        <p className="muted">{view.stage.leagueLabel} · {view.stage.teamName} · {view.stage.seasonLabel} · {view.stage.phaseLabel}</p>
      </section>
      {view.pendingEventTitle ? <p className="notice-card" role="status">처리할 사건이 있습니다: {view.pendingEventTitle}</p> : null}
      <section className="panel" aria-label="진행 방식">
        <fieldset><legend>진행 단위</legend>
          {modes.map(m => (
            <label key={m} className={current === m ? 'choice on' : 'choice'}>
              <input type="radio" name="progress-mode" value={m} checked={current === m} disabled={busy || !!view.pendingEventTitle} onChange={() => onMode?.(m)} />
              <span>{PROGRESS_LABELS[m]}</span>
            </label>
          ))}
        </fieldset>
      </section>
      <section className="panel" aria-label="최근 기록">
        {view.recentRecords.length === 0 ? <p className="empty">{stateText('S03', 'empty')}</p> : (
          <dl className="records">{view.recentRecords.map(r => <div key={r.label}><dt>{r.label}</dt><dd>{r.value}</dd></div>)}</dl>
        )}
      </section>
      <div className="actions" role="group" aria-label="다음 행동">
        {view.nextActions.map(a => (
          <div key={a.id}>
            <Button primary={a.primary} busy={busy} disabled={!!a.disabledReason} describedBy={a.disabledReason ? `why-${a.id}` : undefined} onClick={() => onAction?.(a.id, current)}>{a.label}</Button>
            {a.disabledReason ? <p id={`why-${a.id}`} className="muted">{a.disabledReason}</p> : null}
          </div>
        ))}
      </div>
    </ScreenFrame>
  );
}
