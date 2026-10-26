import { ScreenFrame, Button, isBusy } from '../ui.js';
import { stateText } from '../screen-states.js';
import type { ScreenState } from '../screen-states.js';
import type { HomeData } from '../model.js';

export interface HomeProps {
  data: HomeData | null; state?: ScreenState; showSaves?: boolean; logo?: string;
  onResume?: (saveId: string) => void; onSelect?: (saveId: string) => void; onToggleSaves?: () => void;
  onNew?: (mode: 'CAREER' | 'CLUB') => void; onSettings?: () => void;
}
/** S01 홈. The resume button keeps its label while loading (disabled + aria-busy); interruption/recovery status is never shown.
 * A mode button appears only when its handler exists, so unbuilt modes (구단, 설정) are not dead buttons. */
export function Home({ data, state = 'ready', showSaves = false, logo, onResume, onSelect, onToggleSaves, onNew, onSettings }: HomeProps) {
  const busy = isBusy(state), empty = !data || data.saves.length === 0, resume = data?.resume ?? null;
  return (
    <ScreenFrame id="S01" state={state}>
      <p className="lead">{logo ? <img src={logo} alt="" width="40" height="40" /> : null}<span>당신의 야구는, 다시 시작된다.</span></p>
      {empty ? (
        <section aria-label="시작"><p className="empty">{stateText('S01', 'empty')}</p></section>
      ) : (
        <section aria-label="이어하기">
          {resume ? <Button primary busy={busy} onClick={() => onResume?.(resume.saveId)}>이어하기</Button> : null}
          {resume ? <p className="muted">{data!.saves.find(s => s.saveId === resume.saveId)?.title} · {resume.label}</p> : null}
          {data!.saves.length > 1 ? <Button onClick={onToggleSaves}>다른 게임 선택</Button> : null}
          {showSaves ? (
            <ul className="save-list" aria-label="저장된 게임">
              {data!.saves.map(s => (
                <li key={s.saveId}>
                  <button type="button" className="save-card" disabled={busy} onClick={() => onSelect?.(s.saveId)}>
                    <strong>{s.title}</strong><span>{s.mode === 'CAREER' ? '커리어' : '구단'} · {s.seasonLabel} · {s.phaseLabel}</span><span className="muted">{s.savedAtLabel}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      )}
      <nav aria-label="모드" className="mode-nav">
        {onNew ? <Button primary={empty} onClick={() => onNew('CAREER')}>새 커리어</Button> : null}
        {onSettings ? <Button onClick={onSettings}>설정</Button> : null}
      </nav>
      {data && data.archiveCount > 0 ? <p className="muted">보관한 선수 {data.archiveCount}명</p> : null}
    </ScreenFrame>
  );
}
