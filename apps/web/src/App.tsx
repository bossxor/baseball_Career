import { useEffect, useMemo, useRef, useState } from 'react';
import type { PlayballApi } from './api.js';
import { createFixtureApi } from './fixtures.js';
import { Home } from './screens/Home.js';
import { Create } from './screens/Create.js';
import { Career } from './screens/Career.js';
import { CREATION_STEPS, emptyDraft, firstInvalidStep, toCreationRequest, validateStep } from './creation.js';
import type { CreationDraft, CreationStep, FieldErrors } from './creation.js';
import type { CareerView, HomeData, ProgressMode } from './model.js';
import type { ScreenState } from './screen-states.js';

type Route = { name: 'home' } | { name: 'create' } | { name: 'career'; saveId: string };
export function parseRoute(hash: string): Route {
  const m = /^#\/?([a-z]*)\/?(.*)$/.exec(hash);
  const name = m?.[1], id = m?.[2];
  return name === 'create' ? { name: 'create' } : name === 'career' && id ? { name: 'career', saveId: decodeURIComponent(id) } : { name: 'home' };
}
const go = (path: string) => { location.hash = path; };
// ponytail: one random id per user intent ("same commandId, same result" is the server contract); persist it across reloads when M3 lands.
const newId = () => crypto.randomUUID();

/** Hash-routed shell over `PlayballApi`. A failed call keeps the input and shows the screen's error text. */
export function App({ api: injected, logo }: { api?: PlayballApi; logo?: string }) {
  const api = useMemo(() => injected ?? createFixtureApi(), [injected]);
  const [route, setRoute] = useState<Route>(() => parseRoute(location.hash));
  useEffect(() => { const on = () => setRoute(parseRoute(location.hash)); addEventListener('hashchange', on); return () => removeEventListener('hashchange', on); }, []);

  const [state, setState] = useState<ScreenState>('loading');
  const [home, setHome] = useState<HomeData | null>(null), [showSaves, setShowSaves] = useState(false);
  const [career, setCareer] = useState<CareerView | null>(null), [mode, setMode] = useState<ProgressMode>('NEXT_MAJOR_EVENT');
  const [draft, setDraft] = useState<CreationDraft>(emptyDraft), [step, setStep] = useState<CreationStep>('NAME'), [errors, setErrors] = useState<FieldErrors>({});
  const creationId = useRef(newId());

  const run = async (work: () => Promise<void>) => { setState('saving'); try { await work(); setState('ready'); } catch { setState('error'); } };
  useEffect(() => {
    let alive = true;
    setState('loading');
    (async () => {
      try {
        if (route.name === 'home') { const d = await api.home(); if (alive) { setHome(d); setState('ready'); } }
        else if (route.name === 'career') { const c = await api.career(route.saveId); if (alive) { setCareer(c); setMode(c.progress.mode); setState('ready'); } }
        else setState('ready');
      } catch { if (alive) setState('error'); }
    })();
    return () => { alive = false; };
  }, [route, api]);

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
  if (route.name === 'career') {
    const saveId = route.saveId;
    return <Career view={career} state={state} mode={mode} onMode={setMode} onBack={() => go('#/')}
      onAction={(actionId, m) => void run(async () => { setCareer(await api.act(saveId, actionId, m, newId())); })} />;
  }
  return <Home {...(logo ? { logo } : {})} data={home} state={state} showSaves={showSaves} onToggleSaves={() => setShowSaves(v => !v)}
    onResume={id => go(`#/career/${encodeURIComponent(id)}`)} onSelect={id => go(`#/career/${encodeURIComponent(id)}`)}
    onNew={m => { if (m === 'CAREER') { setDraft(emptyDraft()); setStep('NAME'); setErrors({}); go('#/create'); } }} />;
}
