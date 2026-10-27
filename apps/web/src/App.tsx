import { useEffect, useMemo, useRef, useState } from 'react';
import type { PlayballApi } from './api.js';
import { createFixtureApi } from './fixtures.js';
import { stateFromError } from './errors.js';
import { Home } from './screens/Home.js';
import { Create } from './screens/Create.js';
import { Career } from './screens/Career.js';
import { Decision } from './screens/Decision.js';
import { CREATION_STEPS, emptyDraft, firstInvalidStep, toCreationRequest, validateStep } from './creation.js';
import type { CreationDraft, CreationStep, FieldErrors } from './creation.js';
import type { CareerView, DecisionView, HomeData, PlayScreenId, ProgressMode } from './model.js';
import { isPlayScreen } from './screen-states.js';
import type { ScreenState } from './screen-states.js';

type Route =
  | { name: 'home' }
  | { name: 'create' }
  | { name: 'career'; saveId: string }
  | { name: 'play'; saveId: string; screenId: PlayScreenId };

export function parseRoute(hash: string): Route {
  const play = /^#\/play\/([^/]+)\/(S\d{2})$/.exec(hash);
  if (play && isPlayScreen(play[2]!)) return { name: 'play', saveId: decodeURIComponent(play[1]!), screenId: play[2] };
  const m = /^#\/?([a-z]*)\/?(.*)$/.exec(hash);
  const name = m?.[1], id = m?.[2];
  return name === 'create' ? { name: 'create' } : name === 'career' && id ? { name: 'career', saveId: decodeURIComponent(id) } : { name: 'home' };
}
const go = (path: string) => { location.hash = path; };
const openPlay = (saveId: string, screenId: PlayScreenId) => go(`#/play/${encodeURIComponent(saveId)}/${screenId}`);
const screenFromAction = (actionId: string): PlayScreenId | null => {
  const m = /^open:(S\d{2})$/.exec(actionId);
  return m && isPlayScreen(m[1]!) ? m[1] : null;
};
const newId = () => crypto.randomUUID();

/** A retry after a lost response must reuse the id of the same intent; the id is dropped once the call succeeds. */
function useIntentIds() {
  const ids = useRef(new Map<string, string>());
  return {
    of: (key: string) => { let id = ids.current.get(key); if (!id) { id = newId(); ids.current.set(key, id); } return id; },
    done: (key: string) => { ids.current.delete(key); },
  };
}

/** Hash-routed shell over `PlayballApi`. Failed calls map to error/conflict; conflict offers reload. */
export function App({ api: injected, logo }: { api?: PlayballApi; logo?: string }) {
  const api = useMemo(() => injected ?? createFixtureApi(), [injected]);
  const [route, setRoute] = useState<Route>(() => parseRoute(location.hash));
  const [tick, setTick] = useState(0);
  useEffect(() => { const on = () => setRoute(parseRoute(location.hash)); addEventListener('hashchange', on); return () => removeEventListener('hashchange', on); }, []);

  const [state, setState] = useState<ScreenState>('loading');
  const [home, setHome] = useState<HomeData | null>(null), [showSaves, setShowSaves] = useState(false);
  const [career, setCareer] = useState<CareerView | null>(null), [mode, setMode] = useState<ProgressMode>('NEXT_MAJOR_EVENT');
  const [decision, setDecision] = useState<DecisionView | null>(null), [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<CreationDraft>(emptyDraft), [step, setStep] = useState<CreationStep>('NAME'), [errors, setErrors] = useState<FieldErrors>({});
  const creationId = useRef(newId());
  const intents = useIntentIds();
  const reload = () => setTick(t => t + 1);

  const run = async (work: () => Promise<void>) => {
    setState('saving');
    try { await work(); setState('ready'); }
    catch (err) { setState(stateFromError(err)); }
  };
  useEffect(() => {
    let alive = true;
    setState('loading');
    setSelected(null);
    (async () => {
      try {
        if (route.name === 'home') { const d = await api.home(); if (alive) { setHome(d); setState('ready'); } }
        else if (route.name === 'career') { const c = await api.career(route.saveId); if (alive) { setCareer(c); setMode(c.progress.mode); setState('ready'); } }
        else if (route.name === 'play') { const d = await api.decision(route.saveId, route.screenId); if (alive) { setDecision(d); setState(d.options.length ? 'ready' : 'empty'); } }
        else setState('ready');
      } catch (err) { if (alive) setState(stateFromError(err)); }
    })();
    return () => { alive = false; };
  }, [route, api, tick]);

  if (route.name === 'create') {
    const toStep = (next: CreationStep) => {
      const blocking = CREATION_STEPS.indexOf(next) > CREATION_STEPS.indexOf(step) ? validateStep(draft, step) : {};
      setErrors(blocking);
      if (Object.keys(blocking).length === 0) setStep(next);
    };
    const submit = () => {
      const bad = firstInvalidStep(draft);
      if (bad) { setStep(bad); setErrors(validateStep(draft, bad)); return; }
      const request = toCreationRequest(draft, creationId.current)!;
      void run(async () => { const { saveId } = await api.create(request); creationId.current = newId(); go(`#/career/${encodeURIComponent(saveId)}`); });
    };
    return <Create draft={draft} step={step} state={state === 'loading' ? 'ready' : state} errors={errors} onDraft={d => { setDraft(d); setErrors({}); }} onStep={toStep} onSubmit={submit} onCancel={() => go('#/')} />;
  }
  if (route.name === 'play') {
    const saveId = route.saveId, screenId = route.screenId;
    return <Decision view={decision} screenId={screenId} state={state} selectedId={selected} onReload={reload}
      onSelect={setSelected} onBack={() => go(`#/career/${encodeURIComponent(saveId)}`)}
      onConfirm={() => {
        if (!selected) return;
        void run(async () => {
          const key = `choose|${saveId}|${screenId}|${selected}`;
          const { next } = await api.choose(saveId, screenId, selected, intents.of(key));
          intents.done(key);
          if (next.kind === 'home') go('#/');
          else if (next.kind === 'screen') openPlay(saveId, next.screenId);
          else go(`#/career/${encodeURIComponent(saveId)}`);
        });
      }} />;
  }
  if (route.name === 'career') {
    const saveId = route.saveId;
    return <Career view={career} state={state} mode={mode} onMode={setMode} onBack={() => go('#/')} onReload={reload}
      onAction={(actionId, m) => {
        const screen = screenFromAction(actionId);
        if (screen) { openPlay(saveId, screen); return; }
        const key = `act|${saveId}|${actionId}|${m}`;
        void run(async () => { setCareer(await api.act(saveId, actionId, m, intents.of(key))); intents.done(key); });
      }} />;
  }
  return <Home {...(logo ? { logo } : {})} data={home} state={state} showSaves={showSaves} onToggleSaves={() => setShowSaves(v => !v)} onReload={reload}
    onResume={id => go(`#/career/${encodeURIComponent(id)}`)} onSelect={id => go(`#/career/${encodeURIComponent(id)}`)}
    onNew={m => { if (m === 'CAREER') { setDraft(emptyDraft()); setStep('NAME'); setErrors({}); go('#/create'); } }}
    {...(home?.resume ? { onSettings: () => openPlay(home.resume!.saveId, 'S21') } : {})} />;
}
