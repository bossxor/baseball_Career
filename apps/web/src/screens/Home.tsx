import { Button, bannerFor, isBusy } from '../ui.js';
import type { ScreenState } from '../screen-states.js';
import type { HomeData } from '../model.js';

export interface HomeProps {
  data: HomeData | null; state?: ScreenState; showSaves?: boolean; logo?: string;
  onResume?: (saveId: string) => void; onSelect?: (saveId: string) => void; onToggleSaves?: () => void;
  onNew?: (mode: 'CAREER' | 'CLUB') => void; onSettings?: () => void; onReload?: () => void;
  onStorageSwitch?: () => void; storageSwitchLabel?: string;
  onCopySave?: (saveId: string) => void; copyNotice?: string;
  onDeviceBackups?: () => void;
}

export function Home({ data, state = 'ready', showSaves = false, logo, onResume, onSelect, onToggleSaves, onNew, onSettings, onReload, onStorageSwitch, storageSwitchLabel, onCopySave, copyNotice, onDeviceBackups }: HomeProps) {
  const busy = isBusy(state);
  const saves = data?.saves ?? [];
  const resume = data?.resume;
  const recent = saves.find(save => save.saveId === resume?.saveId);
  const banner = bannerFor('S01', state);

  return (
    <main className="screen clubhouse" aria-labelledby="S01-title" aria-busy={busy} data-screen="S01" data-state={state}>
      <header className="clubhouse-bar">
        <div className="clubhouse-brand">{logo ? <img src={logo} alt="" width="36" height="36" /> : null}<span>다시, 플레이볼</span></div>
        {onSettings || onStorageSwitch ? <nav className="clubhouse-utility" aria-label="저장 및 설정">
          {onSettings ? <button type="button" className="ghost" disabled={busy} onClick={onSettings}>설정</button> : null}
          {onStorageSwitch ? <button type="button" className="ghost" onClick={onStorageSwitch}>{storageSwitchLabel}</button> : null}
        </nav> : null}
      </header>
      <section className="clubhouse-cover" aria-labelledby="S01-title">
        <div className="clubhouse-art" aria-hidden="true" />
        <div className="clubhouse-title">
          <h1 id="S01-title">다시,<br />플레이볼</h1>
          <p>선수로 한 시즌을 뛰거나<br className="clubhouse-break" /> 구단을 맡아 다음 시즌을 준비하세요.</p>
        </div>
      </section>
      {banner ? <div className="clubhouse-message">
        <p className="banner banner-error" role="alert">{banner}</p>
        {onReload ? <Button onClick={onReload}>다시 시도</Button> : null}
      </div> : null}
      <section className="clubhouse-dugout" aria-label={resume ? '이어하기' : '시작'}>
        <div className="clubhouse-play">
          <div className="clubhouse-resume">
            <h2>{recent?.title ?? (busy ? '게임 준비 중' : '첫 경기 준비')}</h2>
            {resume ? <p>{recent?.seasonLabel} {resume.label}</p>
              : data && !saves.length ? <p>최근 세이브가 없습니다.</p> : null}
          </div>
          <div className="clubhouse-play-buttons">
            {resume ? <Button primary busy={busy} onClick={() => onResume?.(resume.saveId)}>이어하기</Button>
              : onNew ? <Button primary busy={busy} onClick={() => onNew('CAREER')}>새 커리어</Button> : null}
            {resume && saves.length === 1 && onCopySave ? <Button busy={busy} onClick={() => onCopySave(resume.saveId)}>이 기기로 복사</Button> : null}
            {saves.length > 1 ? <button type="button" className="btn" aria-expanded={showSaves} onClick={onToggleSaves}>다른 게임 선택</button> : null}
          </div>
        </div>
        <nav aria-label="모드" className="clubhouse-modes">
          {onNew && resume ? <Button busy={busy} onClick={() => onNew('CAREER')}>새 커리어</Button> : null}
          {onNew ? <Button busy={busy} onClick={() => onNew('CLUB')}>새 구단</Button> : null}
          {onDeviceBackups ? <Button busy={busy} onClick={onDeviceBackups}>기기 저장 백업</Button> : null}
        </nav>
        {showSaves ? (
          <ul className="save-list" aria-label="저장된 게임">
            {saves.map(save => (
              <li key={save.saveId}>
                <button type="button" className="save-card" disabled={busy} onClick={() => onSelect?.(save.saveId)}>
                  <strong>{save.title}</strong>
                  <span>{save.mode === 'CAREER' ? '커리어' : '구단'} · {save.seasonLabel} · {save.phaseLabel}</span>
                  <span className="muted">{save.savedAtLabel}</span>
                </button>
                {onCopySave ? <Button busy={busy} onClick={() => onCopySave(save.saveId)}>이 기기로 복사</Button> : null}
              </li>
            ))}
          </ul>
        ) : null}
        {copyNotice ? <p role="status">{copyNotice}</p> : null}
        {data && data.archiveCount > 0 ? <p className="muted">보관한 선수 {data.archiveCount}명</p> : null}
      </section>
    </main>
  );
}
