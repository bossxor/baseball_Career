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
    <main className="screen game-lobby" aria-labelledby="S01-title" aria-busy={busy} data-screen="S01" data-state={state}>
      <header className="game-mast">
        {logo ? <img className="game-mark" src={logo} alt="" width="36" height="36" /> : null}
        <span className="game-mast-word">플레이볼</span>
        {onSettings || onStorageSwitch ? <nav className="game-mast-tools" aria-label="저장 및 설정">
          {onSettings ? <button type="button" className="ghost" disabled={busy} onClick={onSettings}>설정</button> : null}
          {onStorageSwitch ? <button type="button" className="ghost" onClick={onStorageSwitch}>{storageSwitchLabel}</button> : null}
        </nav> : null}
      </header>
      <section className="lobby-hero" aria-labelledby="S01-title">
        <div className="lobby-hero-photo" aria-hidden="true" />
        <div className="lobby-wordmark">
          <h1 id="S01-title"><span>다시,</span><strong>플레이볼</strong></h1>
          <p>나의 첫 타석부터 구단의 마지막 아웃까지</p>
        </div>
      </section>
      {banner ? <div className="lobby-feedback">
        <p className="banner banner-error" role="alert">{banner}</p>
        {onReload ? <Button onClick={onReload}>다시 시도</Button> : null}
      </div> : null}
      <section className="lobby-bench" aria-label={resume ? '이어하기' : '시작'}>
        {resume ? (
          <div className="lobby-resume">
            <div><p className="kicker">최근 저장</p><h2>{recent?.title ?? '저장한 게임'}</h2><p className="muted">{recent?.seasonLabel} {resume.label}</p></div>
            <Button primary busy={busy} onClick={() => onResume?.(resume.saveId)}>이어하기</Button>
            {saves.length === 1 && onCopySave ? <Button busy={busy} onClick={() => onCopySave(resume.saveId)}>이 기기로 복사</Button> : null}
          </div>
        ) : <p className="lobby-save-status muted">{busy ? '저장 목록을 확인하는 중' : data && !saves.length ? '최근 세이브가 없습니다.' : ''}</p>}
        {onNew ? (
          <nav aria-label="모드 선택" className="lobby-modes">
            <div className="mode-launch"><span className="mode-sign" aria-hidden="true">◇</span><div><strong>선수 커리어</strong><p>고교에서 시작해 한 선수의 길을 고릅니다.</p></div><Button primary={!resume} busy={busy} onClick={() => onNew('CAREER')}>새 커리어</Button></div>
            <div className="mode-launch"><span className="mode-sign" aria-hidden="true">▥</span><div><strong>구단 운영</strong><p>선수단, 예산, 다음 시즌을 책임집니다.</p></div><Button busy={busy} onClick={() => onNew('CLUB')}>새 구단</Button></div>
          </nav>
        ) : null}
        {saves.length > 1 || onDeviceBackups ? <div className="lobby-tools">
          {saves.length > 1 ? <button type="button" className="btn" aria-expanded={showSaves} onClick={onToggleSaves}>다른 게임 선택</button> : null}
          {onDeviceBackups ? <Button busy={busy} onClick={onDeviceBackups}>기기 저장 백업</Button> : null}
        </div> : null}
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
