import { ABILITY_LABELS, FOCUS_COUNT } from '@playball/rules';
import type { PlayerKind } from '@playball/rules';
import { ScreenFrame, Button, FieldError, isBusy } from '../ui.js';
import { stateText } from '../screen-states.js';
import type { ScreenState } from '../screen-states.js';
import {
  CREATION_STEPS, STEP_LABELS, POSITIONS, POSITION_LABELS, FORM_LABELS, PITCH_FORM_LIST, typesFor, abilitiesFor,
  previewOf, toggleFocus, setKind,
} from '../creation.js';
import type { CreationDraft, CreationStep, FieldErrors, PitchForm } from '../creation.js';

export interface CreateProps {
  draft: CreationDraft; step: CreationStep; state?: ScreenState; errors?: FieldErrors;
  onDraft?: (draft: CreationDraft) => void; onStep?: (step: CreationStep) => void; onSubmit?: () => void; onCancel?: () => void;
}
const hand = (v: 'R' | 'L') => (v === 'R' ? '우' : '좌');

function Radio<T extends string>({ name, value, current, label, onPick, describedBy }: { name: string; value: T; current: T | null; label: string; onPick?: (v: T) => void; describedBy?: string }) {
  return (
    <label className={current === value ? 'choice on' : 'choice'}>
      <input type="radio" name={name} value={value} checked={current === value} onChange={() => onPick?.(value)} aria-describedby={describedBy} />
      <span>{label}</span>
    </label>
  );
}

/** S02 생성: one decision per step in the 01 order. Moving forward is blocked by that step's own validation; going back is free. */
export function Create({ draft, step, state = 'ready', errors, onDraft, onStep, onSubmit, onCancel }: CreateProps) {
  const set = (patch: Partial<CreationDraft>) => onDraft?.({ ...draft, ...patch });
  const index = CREATION_STEPS.indexOf(step), busy = isBusy(state), err = errors ?? {};
  // The shell validates the leaving step and shows its errors; this screen only asks to move on.
  const next = () => onStep?.(CREATION_STEPS[index + 1]!);
  const preview = previewOf(draft), kind: PlayerKind | null = draft.kind;
  return (
    <ScreenFrame id="S02" state={state} onBack={index === 0 ? onCancel : () => onStep?.(CREATION_STEPS[index - 1]!)}>
      <ol className="stepper" aria-label="생성 단계">
        {CREATION_STEPS.map((s, i) => <li key={s} aria-current={s === step ? 'step' : undefined} className={i < index ? 'done' : s === step ? 'now' : ''}>{STEP_LABELS[s]}</li>)}
      </ol>
      <form className="panel" onSubmit={e => { e.preventDefault(); if (step === 'CONFIRM') onSubmit?.(); else next(); }} noValidate>
        {step === 'NAME' ? (
          <div className="field">
            <label htmlFor="player-name">이름</label>
            <input id="player-name" name="name" type="text" lang="ko" autoComplete="off" enterKeyHint="next" value={draft.name} onChange={e => set({ name: e.target.value })} aria-invalid={err.name ? true : undefined} aria-describedby="name-help name-error" />
            <p id="name-help" className="muted">1~12글자. 공백은 앞뒤에서 지워집니다.</p>
            <FieldError id="name-error" message={err.name} />
          </div>
        ) : null}
        {step === 'KIND' ? (
          <fieldset><legend>타자 또는 투수</legend>
            <Radio name="kind" value="HITTER" current={kind} label="타자" onPick={() => onDraft?.(setKind(draft, 'HITTER'))} />
            <Radio name="kind" value="PITCHER" current={kind} label="투수" onPick={() => onDraft?.(setKind(draft, 'PITCHER'))} />
            <FieldError id="kind-error" message={err.kind} />
          </fieldset>
        ) : null}
        {step === 'POSITION' && kind ? (
          <fieldset><legend>{kind === 'HITTER' ? '포지션' : '보직'}</legend>
            {POSITIONS[kind].map(p => <Radio key={p} name="position" value={p} current={draft.position} label={POSITION_LABELS[p] ?? p} onPick={v => set({ position: v })} />)}
            <FieldError id="position-error" message={err.position} />
          </fieldset>
        ) : null}
        {step === 'HANDS' ? (
          <>
            <fieldset><legend>던지는 손</legend>
              {(['R', 'L'] as const).map(v => <Radio key={v} name="throws" value={v} current={draft.throws} label={`${hand(v)}투`} onPick={x => set({ throws: x })} describedBy="throws-error" />)}
              <FieldError id="throws-error" message={err.throws} />
            </fieldset>
            <fieldset><legend>치는 쪽</legend>
              {(['R', 'L', 'S'] as const).map(v => <Radio key={v} name="bats" value={v} current={draft.bats} label={v === 'S' ? '양타' : `${hand(v)}타`} onPick={x => set({ bats: x })} />)}
              <FieldError id="bats-error" message={err.bats} />
            </fieldset>
            {kind === 'PITCHER' ? (
              <fieldset><legend>투구폼</legend>
                {PITCH_FORM_LIST.map((f: PitchForm) => <Radio key={f} name="form" value={f} current={draft.pitchForm} label={FORM_LABELS[f]} onPick={x => set({ pitchForm: x })} />)}
                <FieldError id="form-error" message={err.pitchForm} />
              </fieldset>
            ) : null}
          </>
        ) : null}
        {step === 'TYPE' && kind ? (
          <fieldset><legend>유형</legend>
            {Object.entries(typesFor(kind)).map(([key, t]) => <Radio key={key} name="archetype" value={key} current={draft.archetype} label={t.label} onPick={v => set({ archetype: v })} />)}
            <FieldError id="archetype-error" message={err.archetype} />
          </fieldset>
        ) : null}
        {step === 'FOCUS' && kind ? (
          <fieldset><legend>집중 육성 {FOCUS_COUNT}개 ({draft.focus.length}/{FOCUS_COUNT})</legend>
            {abilitiesFor(kind).map(k => (
              <label key={k} className={draft.focus.includes(k) ? 'choice on' : 'choice'}>
                <input type="checkbox" name="focus" value={k} checked={draft.focus.includes(k)} disabled={!draft.focus.includes(k) && draft.focus.length >= FOCUS_COUNT} onChange={() => onDraft?.(toggleFocus(draft, k))} />
                <span>{ABILITY_LABELS[k]}</span>
              </label>
            ))}
            <FieldError id="focus-error" message={err.focus} />
          </fieldset>
        ) : null}
        {step === 'CONFIRM' ? (
          <section aria-label="생성 확인">
            <p>{draft.name} · {kind === 'HITTER' ? '타자' : '투수'} · {draft.position ? POSITION_LABELS[draft.position] : ''} · {draft.throws ? hand(draft.throws) : ''}투 {draft.bats ? (draft.bats === 'S' ? '양타' : `${hand(draft.bats)}타`) : ''}{draft.pitchForm ? ` · ${FORM_LABELS[draft.pitchForm]}` : ''}</p>
          </section>
        ) : null}
        <div className="actions">
          {step === 'CONFIRM'
            ? <Button primary type="submit" busy={busy} disabled={!preview}>이 선수로 시작</Button>
            : <Button primary type="submit" busy={busy}>다음</Button>}
        </div>
      </form>
      <section className="panel" aria-label="생성 미리보기" aria-live="polite">
        {preview ? (
          <>
            <h2>{preview.archetypeLabel} · 종합 {preview.overall}</h2>
            <ul className="abilities">{preview.abilities.map(a => <li key={a.key}>{a.label} <strong>{a.value}</strong>{a.focus ? <span className="tag">집중</span> : null}</li>)}</ul>
          </>
        ) : <p className="empty">{stateText('S02', 'empty')}</p>}
      </section>
    </ScreenFrame>
  );
}
