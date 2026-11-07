import type { SaveState } from './engine-command.js';
import type { FlowCommand } from './career-flow-screen.js';
import { proRetirementScreen } from './career-pro-retirement-shell.js';

type Line = { label: string; value: string };
export type RetirementSummary = { name: string; details: Line[]; sections: { title: string; lines: Line[] }[] };

/** Project the existing public archive; commands stay owned by the retirement shell. */
export function retirementSummary(state: SaveState): { summary: RetirementSummary; commands: FlowCommand[]; notice: string | null } | null {
 const c = state.career as {phaseContext?:{phase?:string};retirement?:unknown;retryPro?:{status?:string}} | undefined;
 if (!c || c.phaseContext?.phase !== 'ARCHIVED' || !c.retirement || c.retryPro?.status === 'ARCHIVED') return null;
 const view = proRetirementScreen(state, 'CAREER_PRO_ARCHIVE');
 const archive = view.archive!;
 const details = [
  { label:'은퇴', value:`${archive.retirement.seasonKey} 시즌 · ${archive.retirement.age}세` },
  { label:'마지막 소속', value:archive.retirement.lastTeam.name },
  { label:'포지션', value:archive.player.position },
 ];
 const sections = archive.records.map(({leagueKey,phase,record}) => {
  const lines: Line[] = [{label:'경기',value:String(record.games)}];
  if (record.kind === 'HITTER') lines.push(
   {label:'안타',value:String(record.H)}, {label:'홈런',value:String(record.HR)}, {label:'타점',value:String(record.RBI)},
  );
  else lines.push(
   {label:'승',value:String(record.W)}, {label:'세이브',value:String(record.SV)},
   {label:'이닝',value:record.innings}, {label:'탈삼진',value:String(record.K)},
  );
  const phaseName = phase === 'REGULAR' ? '정규시즌' : phase === 'POSTSEASON' ? '포스트시즌' : '국제대회';
  return {title:`${leagueKey} ${phaseName}`,lines};
 });
 if (archive.income) {
  const income = archive.income;
  const totals = income.totals.filter(t => income.receipts.some(r => r.currency === t.currency));
  if (totals.length) sections.push({title:'누적 수입',lines:totals.map(t => ({
   label:t.currency === 'KRW' ? '원화 총수입' : '달러 총수입',
   value:t.currency === 'KRW' ? `${t.gross.toLocaleString('ko-KR')}원` : `$${t.gross.toLocaleString('en-US')}`,
  }))});
 }
 const e = view.farewell;
 const commands: FlowCommand[] = e?.commands.includes('OPEN_ARCHIVE') ? [{
  id:'retirement-archive',label:'기록 보관 확인',type:'CAREER_PRO_RETIRE_OPEN_ARCHIVE',
  payload:{careerRevision:view.careerRevision,eventKey:e.eventKey,eventVersion:e.eventVersion},
 }] : [];
 return {summary:{name:archive.player.name,details,sections},commands,notice:e?.status === 'OPEN' ? e.body : null};
}
