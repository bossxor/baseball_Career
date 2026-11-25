import { Empty, ScreenFrame, Button, isBusy } from '../ui.js';
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
    return <ScreenFrame id="S03" state={state} {...frame}><Empty>{stateText('S03', 'empty')}</Empty></ScreenFrame>;
  }
  const current = mode ?? view.progress.mode, modes: readonly ProgressMode[] = [view.progress.mode, ...view.progress.alternatives];
  const { protagonist, stage } = view;
  const primaryId = view.nextActions.find(action => action.primary && !action.disabledReason)?.id;
  return (
    <ScreenFrame id="S03" state={state} {...frame}>
      <div className="play-area career-play-area">
        <section className="career-scoreboard" aria-label="선수">
          <div className="career-player">
            <div className="career-player-mark" aria-hidden="true" data-kind={/투수/.test(protagonist.kindLabel) ? 'pitcher' : 'hitter'} />
            <div>
              <h2>{protagonist.name}</h2>
              <p>{[protagonist.kindLabel, protagonist.positionLabel, protagonist.ageLabel].filter(Boolean).join(' · ')}</p>
            </div>
          </div>
          <dl className="career-season">
            <div><dt>소속</dt><dd>{[stage.leagueLabel, stage.teamName].filter(Boolean).join(' · ')}</dd></div>
            <div><dt>시즌</dt><dd>{stage.seasonLabel}</dd></div>
            <div><dt>일정</dt><dd>{stage.phaseLabel}</dd></div>
          </dl>
        </section>
        <section className="play-area-panel career-records" aria-labelledby="career-records-title">
          <h2 id="career-records-title">최근 기록</h2>
          {view.recentRecords.length === 0 ? <p className="muted">{stateText('S03', 'empty')}</p> : (
            <dl>{view.recentRecords.map(r => <div key={r.label}><dt>{r.label}</dt><dd>{r.value}</dd></div>)}</dl>
          )}
        </section>
        {view.pendingEventTitle ? <p className="career-notice" role="status">처리할 사건이 있습니다: {view.pendingEventTitle}</p> : null}
        <section className="play-area-panel career-controls" aria-label="다음 행동">
          <fieldset className="career-modes"><legend>진행 단위</legend>
            <div className="career-mode-options">
              {modes.map(m => (
                <label key={m} className={current === m ? 'choice on' : 'choice'}>
                  <input type="radio" name="progress-mode" value={m} checked={current === m} disabled={busy || !!view.pendingEventTitle} onChange={() => onMode?.(m)} />
                  <span>{PROGRESS_LABELS[m]}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="career-action-list">
            {view.nextActions.map(a => (
              <div key={a.id} className={a.id === primaryId ? 'career-primary-action' : undefined}>
                <Button primary={a.id === primaryId} busy={busy} disabled={!!a.disabledReason} describedBy={a.disabledReason ? `why-${a.id}` : undefined} onClick={() => onAction?.(a.id, current)}>{a.label}</Button>
                {a.disabledReason ? <p id={`why-${a.id}`} className="muted">{a.disabledReason}</p> : null}
              </div>
            ))}
          </div>
        </section>
      </div>
    </ScreenFrame>
  );
}
