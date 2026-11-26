import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { PlayballApi } from './api.js';
import { createFixtureApi } from './fixtures.js';
import { ApiError, stateFromError } from './errors.js';
import { Home } from './screens/Home.js';
import { Create } from './screens/Create.js';
import { Career } from './screens/Career.js';
import { Decision } from './screens/Decision.js';
import { Flow } from './screens/Flow.js';
import { ClubNew, ClubView } from './screens/Club.js';
import { DeviceBackups, type DeviceBackupActions } from './screens/DeviceBackups.js';
import { CREATION_STEPS, emptyDraft, firstInvalidStep, toCreationRequest, validateStep } from './creation.js';
import type { CreationDraft, CreationStep, FieldErrors } from './creation.js';
import type { CareerView, ClubScreen, ClubScreenId, DecisionView, FlowView, HomeData, PlayScreenId, ProgressMode, SeasonJobView } from './model.js';
import { isPlayScreen } from './screen-states.js';
import { Button } from './ui.js';
import type { ScreenState } from './screen-states.js';
import { observeSeasonJob, regularSeasonCommand, runFlowCommands } from './flow-season.js';

const CLUB_SCREENS = new Set<string>(['S13', 'S14', 'S15', 'S16', 'S17', 'S18', 'S19']);
type Route =
  | { name: 'home' }
  | { name: 'device-backups' }
  | { name: 'create' }
  | { name: 'career'; saveId: string }
  | { name: 'flow'; saveId: string }
  | { name: 'play'; saveId: string; screenId: PlayScreenId }
  | { name: 'club-new' }
  | { name: 'club'; saveId: string; screenId: ClubScreenId };

export function parseRoute(hash: string): Route {
  try {
    return parseKnownRoute(hash);
  } catch (error) {
    if (error instanceof URIError) return { name: 'home' };
    throw error;
  }
}

function parseKnownRoute(hash: string): Route {
  if (hash === '#/device-backups') return { name: 'device-backups' };
  const club = /^#\/club\/([^/]+)(?:\/(S1[3-9]))?$/.exec(hash);
  if (club) {
    const id = decodeURIComponent(club[1]!);
    if (id === 'new') return { name: 'club-new' };
    const screenId = club[2] && CLUB_SCREENS.has(club[2]) ? club[2] as ClubScreenId : 'S13';
    return { name: 'club', saveId: id, screenId };
  }
  const flow = /^#\/flow\/([^/]+)$/.exec(hash);
  if (flow) return { name: 'flow', saveId: decodeURIComponent(flow[1]!) };
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
    done: (key: string, expected?: string) => {
      if (expected === undefined || ids.current.get(key) === expected) ids.current.delete(key);
    },
  };
}

type ChronicleFile = Awaited<ReturnType<NonNullable<PlayballApi['exportChronicle']>>>;

function observeConnection(notify: () => void) {
  addEventListener('online', notify);
  addEventListener('offline', notify);
  return () => { removeEventListener('online', notify); removeEventListener('offline', notify); };
}

function ChronicleDownload({ read, disabled }: {
  read: () => Promise<ChronicleFile>; disabled: boolean;
}) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const active = useRef(false);
  const downloading = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  async function download() {
    if (disabled || downloading.current) return;
    downloading.current = true;
    setStatus('saving');
    const routeHash = location.hash;
    try {
      const { blob, fileName } = await read();
      if (!active.current || location.hash !== routeHash) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      try {
        document.body.append(link);
        link.click();
      } finally {
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1_000);
      }
      setStatus('done');
    } catch {
      if (active.current && location.hash === routeHash) setStatus('error');
    } finally {
      downloading.current = false;
    }
  }

  return <div>
    <Button busy={status === 'saving'} disabled={disabled} onClick={() => { void download(); }}>연대기 JSON 받기</Button>
    <span className="muted" role="status">
      {status === 'saving' ? ' 연대기 파일 준비 중' : status === 'done' ? ' 다운로드를 시작했습니다.' : ''}
    </span>
    {status === 'error' ? <p role="alert">연대기를 받지 못했습니다. 다시 시도하세요.</p> : null}
  </div>;
}

/** Hash-routed shell over `PlayballApi`. Failed calls map to error/conflict; conflict offers reload. */
export function App({ api: injected, logo, onStorageSwitch, storageSwitchLabel, onCopySave, deviceBackups }: {
  api?: PlayballApi; logo?: string; onStorageSwitch?: () => void; storageSwitchLabel?: string;
  onCopySave?: (id: string) => Promise<void>;
  deviceBackups?: DeviceBackupActions;
}) {
  const api = useMemo(() => injected ?? createFixtureApi(), [injected]);
  const online = useSyncExternalStore(observeConnection, () => navigator.onLine !== false, () => true);
  const [route, setRoute] = useState<Route>(() => parseRoute(location.hash));
  const [tick, setTick] = useState(0);
  const flowRun = useRef<symbol | null>(null);
  useEffect(() => {
    const on = () => {
      flowRun.current = null;
      setState('loading');
      setRoute(parseRoute(location.hash));
      window.scrollTo(0, 0);
    };
    addEventListener('hashchange', on);
    return () => { flowRun.current = null; removeEventListener('hashchange', on); };
  }, [api]);

  const [state, setState] = useState<ScreenState>('loading');
  const [home, setHome] = useState<HomeData | null>(null), [showSaves, setShowSaves] = useState(false);
  const [copyNotice, setCopyNotice] = useState('');
  const [career, setCareer] = useState<CareerView | null>(null), [mode, setMode] = useState<ProgressMode>('NEXT_MAJOR_EVENT');
  const [decision, setDecision] = useState<DecisionView | null>(null), [selected, setSelected] = useState<string | null>(null);
  const [clubView, setClubView] = useState<ClubScreen | null>(null), [flowView, setFlowView] = useState<FlowView | null>(null);
  const [seasonJob, setSeasonJob] = useState<SeasonJobView | null>(null);
  const [seasonJobsEnabled, setSeasonJobsEnabled] = useState(false);
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
    const controller = new AbortController();
    setState('loading');
    setSelected(null);
    (async () => {
      try {
        if (route.name === 'home' || (route.name === 'device-backups' && !deviceBackups)) { const d = await api.home(); if (alive) { setHome(d); setState('ready'); } }
        else if (route.name === 'career') {
          const activeJob = await api.seasonJobs?.read(route.saveId, controller.signal);
          if (!alive) return;
          if (activeJob?.status === 'RUNNING') {
            location.replace(`#/flow/${encodeURIComponent(route.saveId)}`);
            return;
          }
          const c = await api.career(route.saveId);
          if (alive) { setCareer(c); setMode(c.progress.mode); setState('ready'); }
        }
        else if (route.name === 'play') { const d = await api.decision(route.saveId, route.screenId); if (alive) { setDecision(d); setState(d.options.length ? 'ready' : 'empty'); } }
        else if (route.name === 'flow') {
          const saveId = route.saveId, jobs = api.seasonJobs;
          setFlowView(null);
          setSeasonJob(null);
          setSeasonJobsEnabled(false);
          const job = jobs && await observeSeasonJob(
            () => jobs.read(saveId, controller.signal),
            setSeasonJob,
            controller.signal,
          );
          if (!alive) return;
          const view = await api.flow(saveId);
          if (alive) {
            setSeasonJob(null);
            setSeasonJobsEnabled(job !== undefined);
            setFlowView(view);
            setState(job?.status === 'FAILED' ? 'error' : 'ready');
          }
        }
        else if (route.name === 'club') { const view = await api.club(route.saveId, route.screenId); if (alive) { setClubView(view); setState(view.lines.length ? 'ready' : 'empty'); } }
        else setState('ready');
      } catch (err) { if (alive) { setSeasonJob(null); setState(stateFromError(err)); } }
    })();
    return () => { alive = false; controller.abort(); };
  }, [route, api, tick, deviceBackups]);

  if (route.name === 'device-backups' && deviceBackups) {
    return <DeviceBackups actions={deviceBackups} onBack={() => go('#/')} />;
  }

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
  const openSave = (id: string) => {
    const mode = home?.saves.find(save => save.saveId === id)?.mode;
    go(mode === 'CLUB' ? `#/club/${encodeURIComponent(id)}/S13` : `#/career/${encodeURIComponent(id)}`);
  };
  if (route.name === 'club-new') {
    return <ClubNew state={state === 'loading' ? 'ready' : state} onBack={() => go('#/')} onPick={clubId => {
      void run(async () => {
        const { saveId } = await api.createClub({ commandId: creationId.current, clubId });
        creationId.current = newId();
        go(`#/club/${encodeURIComponent(saveId)}/S13`);
      });
    }} />;
  }
  if (route.name === 'club') {
    const saveId = route.saveId, screenId = route.screenId;
    return <ClubView view={clubView} state={state} onBack={() => go('#/')} onReload={reload}
      onOpen={next => go(`#/club/${encodeURIComponent(saveId)}/${next}`)}
      onCommand={(type, payload) => {
        void run(async () => { await api.clubCommand(saveId, newId(), type, payload); setClubView(await api.club(saveId, screenId)); });
      }} />;
  }
  const chronicleDownload = (saveId: string) => {
    const exportChronicle = api.exportChronicle;
    if (!exportChronicle || !online) return null;
    const key = `chronicle|${saveId}`;
    return <ChronicleDownload key={saveId} disabled={state !== 'ready'} read={async () => {
      const requestId = intents.of(key);
      try {
        const file = await exportChronicle(saveId, requestId);
        intents.done(key, requestId);
        return file;
      } catch (error) {
        if (error instanceof ApiError && error.code === 'FILE_NOT_FOUND') intents.done(key, requestId);
        throw error;
      }
    }} />;
  };
  if (route.name === 'flow') {
    const saveId = route.saveId;
    return <Flow view={flowView} state={state} seasonJob={seasonJob} chronicle={chronicleDownload(saveId)} onBack={() => go(seasonJob ? '#/' : `#/career/${encodeURIComponent(saveId)}`)} onReload={reload}
      onCommand={cmd => {
        if (flowRun.current || seasonJob) return;
        const token = Symbol(), hash = location.hash;
        flowRun.current = token;
        const current = () => flowRun.current === token && location.hash === hash;
        setState('saving');
        void (async () => {
          try {
            const revision = flowView?.saveRevision;
            if (seasonJobsEnabled && api.seasonJobs && revision && regularSeasonCommand(cmd)) {
              const key = `season-job|${saveId}|${revision}`;
              const job = await api.seasonJobs.start(saveId, intents.of(key), revision);
              intents.done(key);
              if (current()) {
                if (job.status === 'RUNNING') setSeasonJob(job);
                reload();
              }
              return;
            }
            await runFlowCommands(cmd, async command => {
              // A failed refresh retries the same served intent and command ID.
              const key = `flow|${saveId}|${command.id}|${String(command.payload.careerRevision ?? '')}`;
              const view = await api.flowCommand(saveId, intents.of(key), command.type, command.payload);
              intents.done(key);
              return view;
            }, setFlowView, current);
            if (current()) setState('ready');
          } catch (err) {
            if (current()) setState(stateFromError(err));
          } finally {
            if (flowRun.current === token) flowRun.current = null;
          }
        })();
      }} />;
  }
  if (route.name === 'career') {
    const saveId = route.saveId;
    return <Career view={career} state={state} mode={mode} chronicle={chronicleDownload(saveId)} onMode={setMode} onBack={() => go('#/')} onReload={reload}
      onAction={(actionId, m) => {
        if (actionId === 'open:FLOW') { go(`#/flow/${encodeURIComponent(saveId)}`); return; }
        const screen = screenFromAction(actionId);
        if (screen) { openPlay(saveId, screen); return; }
        const key = `act|${saveId}|${actionId}|${m}`;
        void run(async () => { setCareer(await api.act(saveId, actionId, m, intents.of(key))); intents.done(key); });
      }} />;
  }
  return <Home {...(logo ? { logo } : {})} data={home} state={state} showSaves={showSaves} onToggleSaves={() => setShowSaves(v => !v)} onReload={reload}
    onResume={openSave} onSelect={openSave}
    onNew={m => { if (m === 'CAREER') { setDraft(emptyDraft()); setStep('NAME'); setErrors({}); go('#/create'); } else go('#/club/new'); }}
    {...(home?.resume ? { onSettings: () => openPlay(home.resume!.saveId, 'S21') } : {})}
    {...(deviceBackups ? { onDeviceBackups: () => go('#/device-backups') } : {})}
    {...(onCopySave ? { copyNotice, onCopySave: (id: string) => {
      setCopyNotice('기기로 복사 중');
      void run(async () => {
        try { await onCopySave(id); setCopyNotice('이 기기 게임에서 복사한 저장을 열 수 있습니다.'); }
        catch (error) { setCopyNotice('저장을 복사하지 못했습니다. 연결을 확인하고 다시 시도하세요.'); throw error; }
      });
    } } : {})}
    {...(onStorageSwitch && storageSwitchLabel ? { onStorageSwitch, storageSwitchLabel } : {})} />;
}
