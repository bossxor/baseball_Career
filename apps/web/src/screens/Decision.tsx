import { ScreenFrame, Button, isBusy } from '../ui.js';
import { stateText } from '../screen-states.js';
import type { ScreenState } from '../screen-states.js';
import type { DecisionView, PlayScreenId } from '../model.js';

export interface DecisionProps {
  view: DecisionView | null; screenId: PlayScreenId; state?: ScreenState;
  selectedId?: string | null;
  onSelect?: (optionId: string) => void;
  onConfirm?: () => void;
  onBack?: () => void;
  onReload?: () => void;
}
/** Shared UI for S04–S09·S22·S23·S28: summary lines + one selected option + confirm. Empty options use the screen empty text. */
export function Decision({ view, screenId, state = 'ready', selectedId = null, onSelect, onConfirm, onBack, onReload }: DecisionProps) {
  const busy = isBusy(state);
  const frame = { ...(onBack ? { onBack } : {}), ...(onReload ? { onReload } : {}) };
  if (!view || view.options.length === 0) {
    return (
      <ScreenFrame id={screenId} state={state === 'ready' ? 'empty' : state} {...frame}>
        <p className="empty">{stateText(screenId, 'empty')}</p>
        {onBack ? <Button onClick={onBack}>돌아가기</Button> : null}
      </ScreenFrame>
    );
  }
  return (
    <ScreenFrame id={screenId} state={state} {...frame}>
      {view.notice ? <p className="notice-card" role="status">{view.notice}</p> : null}
      <section className="panel" aria-label="요약">
        {view.summary.length === 0 ? <p className="empty">{stateText(screenId, 'empty')}</p> : (
          <dl className="records">{view.summary.map(r => <div key={r.label}><dt>{r.label}</dt><dd>{r.value}</dd></div>)}</dl>
        )}
      </section>
      <fieldset><legend>선택</legend>
        {view.options.map(o => (
          <div key={o.id}>
            <label className={selectedId === o.id ? 'choice on' : 'choice'}>
              <input type="radio" name={`${screenId}-opt`} value={o.id} checked={selectedId === o.id}
                disabled={busy || !!o.disabledReason} aria-describedby={o.disabledReason ? `why-${o.id}` : undefined}
                onChange={() => onSelect?.(o.id)} />
              <span>{o.label}</span>
            </label>
            {o.disabledReason ? <p id={`why-${o.id}`} className="muted">{o.disabledReason}</p> : null}
          </div>
        ))}
      </fieldset>
      <div className="actions">
        <Button primary busy={busy} disabled={!selectedId} onClick={onConfirm}>확정</Button>
      </div>
    </ScreenFrame>
  );
}
