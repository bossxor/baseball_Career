import { careerAchievementsView } from '@playball/engine';
import type { KboCareer, UsCareer } from '@playball/engine';
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
 const career = state.career as KboCareer | UsCareer;
 if (career.achievements) {
  const achieved = careerAchievementsView(career).achievements.filter(a => a.status === 'COMPLETED');
  if (achieved.length) sections.push({title:'주요 업적',lines:achieved.map(a=>({label:a.achievementId,value:a.condition}))});
 }
 const awards:Line[] = [];
 for (const receipt of career.proAwards?.annual ?? []) for (const award of receipt.awards) {
  if (award.playerKey===career.protagonistKey) awards.push({label:award.awardType,value:`${receipt.leagueKey} · ${receipt.seasonKey} 시즌`});
 }
 for (const receipt of career.proAwards?.allStars ?? []) {
  const selected=receipt.selected.find(row=>row.playerKey===career.protagonistKey);
  if (selected) awards.push({label:'올스타',value:`${receipt.leagueKey} · ${receipt.seasonKey} 시즌 · ${selected.position}`});
 }
 if (awards.length) sections.push({title:'수상',lines:awards});
 const milestones = (career.proResults?.notices ?? []).filter(e=>e.definitionId==='E24');
 const milestoneNames:Record<string,string> = {'100_H':'통산 100안타','10_W':'통산 10승','20_SV':'통산 20세이브'};
 const milestoneLines:Line[] = [];
 for (const event of milestones) {
  let key:unknown;
  try { key=JSON.parse(String(event.evidence.fields.milestoneKey)); } catch { continue; }
  if (!Array.isArray(key) || key.length!==3 || key[0]!=='first-pro-record' || typeof key[1]!=='string' || typeof key[2]!=='string' || !milestoneNames[key[2]]) continue;
  milestoneLines.push({label:milestoneNames[key[2]]!,value:`${key[1]} · ${event.seasonKey} 시즌`});
 }
 if (milestoneLines.length) sections.push({title:'주요 이정표',lines:milestoneLines});
 const e = view.farewell;
 const commands: FlowCommand[] = e?.commands.includes('OPEN_ARCHIVE') ? [{
  id:'retirement-archive',label:'기록 보관 확인',type:'CAREER_PRO_RETIRE_OPEN_ARCHIVE',
  payload:{careerRevision:view.careerRevision,eventKey:e.eventKey,eventVersion:e.eventVersion},
 }] : [];
 return {summary:{name:archive.player.name,details,sections},commands,notice:e?.status === 'OPEN' ? e.body : null};
}
