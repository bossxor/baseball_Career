import { Button, GameHeader, isBusy } from '../ui.js';
import type { ScreenState } from '../screen-states.js';
import type { ClubScreen, ClubScreenId } from '../model.js';
import { CLUB_CHOICES } from '../club.js';

export function ClubNew({ state = 'ready', onPick, onBack }: { state?: ScreenState; onPick: (clubId: string) => void; onBack: () => void }) {
  const busy = isBusy(state);
  return (
    <main className="screen club-play" data-screen="S12" data-state={state} aria-busy={busy} aria-labelledby="club-title">
      <GameHeader onBack={onBack} />
      <h1 className="screen-title" id="club-title">구단 만들기</h1>
      {state === 'error' ? <p className="banner banner-error" role="alert">구단을 만들지 못했습니다. 선택한 구단을 다시 누르세요.</p> : null}
      <nav aria-label="구단 선택" className="club-team-choices">
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
  const home = view?.screenId === 'S13';
  const board = view && (
    <section className="play-area-panel club-board" aria-label={home ? '구단 현황' : '상세 정보'}>
      {view.lines.length ? <dl>
        {view.lines.map((line, index) => <div key={`${line.label}:${index}`}><dt>{line.label}</dt><dd>{line.value}</dd></div>)}
      </dl> : <p className="muted">표시할 기록이 없습니다.</p>}
    </section>
  );
  const commands = view?.commands.length ? (
    <section className="play-area-panel" aria-labelledby="club-actions-title">
      <h2 id="club-actions-title">구단 작업</h2>
      <div className="club-buttons">
        {view.commands.map(command => <Button key={command.id} primary={home && ['start', 'day', 'next'].includes(command.id)} disabled={busy} onClick={() => onCommand(command.type, command.payload)}>{command.label}</Button>)}
      </div>
    </section>
  ) : null;
  return (
    <main className="screen club-play" data-screen={view?.screenId ?? 'S13'} data-state={state} aria-busy={busy} aria-labelledby="club-title">
      <GameHeader onBack={onBack} />
      <h1 className="screen-title" id="club-title">{view?.title ?? '구단'}</h1>
      {state === 'error' ? <p className="banner banner-error" role="alert">구단 정보를 불러오지 못했습니다.</p> : null}
      {state === 'error' && onReload ? <Button onClick={onReload}>다시 불러오기</Button> : null}
      {state === 'conflict' && onReload ? <Button primary onClick={onReload}>최신 저장 불러오기</Button> : null}
      {view ? (
        <div className="play-area club-play-area">
          {home ? board : null}
          <aside className="club-workbench">
            {home ? commands : null}
            {view.links.length ? <nav className="play-area-panel" aria-labelledby="club-links-title">
              <h2 id="club-links-title">구단 메뉴</h2>
              <div className="club-buttons">
                {view.links.map(link => <Button key={link.screenId} disabled={busy} onClick={() => onOpen(link.screenId)}>{link.label}</Button>)}
              </div>
            </nav> : null}
            {home ? null : commands}
          </aside>
          {home ? null : board}
        </div>
      ) : null}
    </main>
  );
}
