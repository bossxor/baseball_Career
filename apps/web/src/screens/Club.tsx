import { Button, isBusy } from '../ui.js';
import type { ScreenState } from '../screen-states.js';
import type { ClubScreen, ClubScreenId } from '../model.js';
import { CLUB_CHOICES } from '../club.js';

export function ClubNew({ state = 'ready', onPick, onBack }: { state?: ScreenState; onPick: (clubId: string) => void; onBack: () => void }) {
  const busy = isBusy(state);
  return (
    <main className="screen" data-screen="S12" data-state={state} aria-busy={busy}>
      <header className="topbar"><button type="button" className="ghost" onClick={onBack}>뒤로</button></header>
      <h1 className="screen-title">구단 만들기</h1>
      <nav aria-label="구단" className="mode-nav">
        {CLUB_CHOICES.map(([id, name]) => <Button key={id} disabled={busy} onClick={() => onPick(id)}>{name}</Button>)}
      </nav>
    </main>
  );
}

export function ClubView({
  view, state = 'ready', onOpen, onCommand, onBack, onReload,
}: {
  view: ClubScreen | null; state?: ScreenState;
  onOpen: (screenId: ClubScreenId) => void; onCommand: (type: string, payload: Record<string, unknown>) => void;
  onBack: () => void; onReload?: () => void;
}) {
  const busy = isBusy(state);
  return (
    <main className="screen" data-screen={view?.screenId ?? 'S13'} data-state={state} aria-busy={busy}>
      <header className="topbar"><button type="button" className="ghost" onClick={onBack}>뒤로</button></header>
      <h1 className="screen-title">{view?.title ?? '구단'}</h1>
      {state === 'conflict' && onReload ? <Button primary onClick={onReload}>최신 저장 불러오기</Button> : null}
      {view ? (
        <>
          <ul aria-label="내용">
            {view.lines.map(line => <li key={`${line.label}:${line.value}`}><span>{line.label}</span> {line.value}</li>)}
          </ul>
          <nav aria-label="이동" className="mode-nav">
            {view.links.map(link => <Button key={link.screenId} disabled={busy} onClick={() => onOpen(link.screenId)}>{link.label}</Button>)}
          </nav>
          <nav aria-label="명령" className="mode-nav">
            {view.commands.map(command => <Button key={command.id} primary disabled={busy} onClick={() => onCommand(command.type, command.payload)}>{command.label}</Button>)}
          </nav>
        </>
      ) : null}
    </main>
  );
}
