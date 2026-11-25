import { useEffect, useRef, useState } from 'react';
import type { AccountDeviceBackup } from '../device-save-copy.js';
import { ApiError } from '../errors.js';
import type { SaveSummary } from '../model.js';
import { Button, Empty, GameHeader } from '../ui.js';

export type DeviceBackupActions = {
  listDevice: () => Promise<readonly SaveSummary[]>;
  listAccount: () => Promise<readonly AccountDeviceBackup[]>;
  upload: (saveId: string) => Promise<void>;
  restore: (backupId: string) => Promise<void>;
};

const backupDate = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Seoul' });
const modeLabel = (mode: SaveSummary['mode']) => mode === 'CAREER' ? '커리어' : '구단';

function backupTitle(backup: AccountDeviceBackup): string {
  const name = backup.summary.name ?? backup.summary.clubId;
  return typeof name === 'string' && name.trim() ? name : modeLabel(backup.mode);
}

function backupTime(createdAt: string): string {
  const date = new Date(createdAt);
  return Number.isFinite(date.getTime()) ? backupDate.format(date) : '날짜 없음';
}

export function DeviceBackups({ actions, onBack }: { actions: DeviceBackupActions; onBack: () => void }) {
  const [lists, setLists] = useState<{ device: readonly SaveSummary[]; account: readonly AccountDeviceBackup[] } | null>(null);
  const [reload, setReload] = useState(0);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [operation, setOperation] = useState<'upload' | 'restore' | null>(null);
  const [feedback, setFeedback] = useState<{ kind: 'status' | 'alert'; text: string } | null>(null);
  const pending = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => { heading.current?.focus(); }, []);
  useEffect(() => {
    let active = true;
    void Promise.all([actions.listDevice(), actions.listAccount()]).then(([device, account]) => {
      if (!active) return;
      setLists({ device, account });
      setLoadState('ready');
    }).catch(() => { if (active) setLoadState('error'); });
    return () => { active = false; };
  }, [actions, reload]);

  const refresh = () => {
    setLoadState('loading');
    setReload(value => value + 1);
  };
  const transfer = async (kind: 'upload' | 'restore', id: string) => {
    if (pending.current) return;
    pending.current = true;
    setOperation(kind);
    setFeedback(null);
    try {
      await actions[kind](id);
      setFeedback({
        kind: 'status',
        text: kind === 'upload' ? '계정에 백업했습니다.' : '이 기기 게임에서 복원한 저장을 열 수 있습니다.',
      });
      refresh();
    } catch (error) {
      setFeedback({
        kind: 'alert',
        text: error instanceof ApiError && error.code === 'DEVICE_BACKUP_TOO_LARGE'
          ? '저장이 백업 한도인 128MB를 초과합니다.'
          : kind === 'upload' ? '백업하지 못했습니다. 잠시 후 다시 시도하세요.' : '복원하지 못했습니다. 잠시 후 다시 시도하세요.',
      });
    } finally {
      pending.current = false;
      setOperation(null);
    }
  };

  const busy = loadState === 'loading' || operation !== null;
  return (
    <main className="screen" aria-labelledby="device-backups-title">
      <GameHeader onBack={onBack} />
      <h1 id="device-backups-title" className="screen-title" ref={heading} tabIndex={-1}>기기 저장 백업</h1>
      <p className="lead">기기 저장을 계정에 백업하면 다른 기기에서 새 저장으로 복원할 수 있습니다.</p>
      {operation || feedback || loadState !== 'ready' ? <div className="notice-card">
        {operation ? <p role="status">{operation === 'upload' ? '계정에 백업 중' : '이 기기로 복원 중'}</p> : null}
        {feedback ? <p role={feedback.kind}>{feedback.text}</p> : null}
        {loadState === 'loading' && !operation ? <p role="status">저장 목록을 불러오는 중</p> : null}
        {loadState === 'error' ? <><p role="alert">저장 목록을 불러오지 못했습니다.</p><Button onClick={refresh}>다시 불러오기</Button></> : null}
      </div> : null}
      {lists ? (
        <>
          <section className="panel" aria-labelledby="backup-device-title">
            <h2 id="backup-device-title">이 기기 게임</h2>
            {lists.device.length === 0 ? <Empty>이 기기에 저장된 게임이 없습니다.</Empty> : (
              <ul className="save-list">
                {lists.device.map((save, index) => <li key={save.saveId}>
                  <div className="save-card">
                    <strong id={`device-backup-source-${index}`}>{save.title}</strong><span>{modeLabel(save.mode)} · {save.seasonLabel} · {save.savedAtLabel}</span>
                    <Button disabled={busy} describedBy={`device-backup-source-${index}`} onClick={() => { void transfer('upload', save.saveId); }}>계정에 백업</Button>
                  </div>
                </li>)}
              </ul>
            )}
          </section>
          <section className="panel" aria-labelledby="backup-account-title">
            <h2 id="backup-account-title">계정 백업</h2>
            {lists.account.length === 0 ? <Empty>계정에 보관된 기기 백업이 없습니다.</Empty> : (
              <ul className="save-list">
                {lists.account.map((backup, index) => <li key={backup.id}>
                  <div className="save-card">
                    <strong id={`device-backup-archive-${index}`}>{backupTitle(backup)}</strong><span>{modeLabel(backup.mode)} · <time dateTime={backup.createdAt}>{backupTime(backup.createdAt)}</time></span>
                    <Button disabled={busy} describedBy={`device-backup-archive-${index}`} onClick={() => { void transfer('restore', backup.id); }}>이 기기로 복원</Button>
                  </div>
                </li>)}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}
