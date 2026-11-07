import { battingRates, pitchingRates, inningsDisplay, recordTotals } from '@playball/engine';
import type { HighSchoolCareer, KboCareer, UsCareer } from '@playball/engine';
import { ABILITY_LABELS, UNITS_PER_POINT, abilityKeys } from '@playball/rules';
import type { SaveState } from './engine-command.js';

type Line = { label: string; value: string };
export type SeasonReview = { season: string; sections: { title: string; lines: Line[] }[] };

/** Project only committed regular-season records and settled ledger values. */
export function careerSeasonReview(state: SaveState): SeasonReview | null {
 const c = state.career as HighSchoolCareer | KboCareer | UsCareer | undefined;
 if (!c?.world || c.phaseContext.phase !== 'SEASON_REVIEW' || !c.records?.games) return null;
 const key = 'protagonistKey' in c ? c.protagonistKey : c.world.protagonistKey;
 const team = 'protagonistClubId' in c ? c.protagonistClubId
  : 'protagonistOrganizationId' in c ? c.protagonistOrganizationId : c.world.protagonistSchoolId;
 const player = c.world.players[key]; if (!player) return null;
 const season = c.world.seasonKey, sections: SeasonReview['sections'] = [];
 const leagues = [...new Set(Object.values(c.records.games)
  .filter(g => g.scope.seasonKey === season && g.scope.phase === 'REGULAR' && (g.batting[key] || g.pitching[key] || g.teams[team]))
  .map(g => g.scope.leagueKey))];
 const rate = (n: number | null) => n === null ? '—' : n.toFixed(3);
 for (const league of leagues) {
  const totals = recordTotals(c.records, { seasonKey: season, leagueKey: league, phase: 'REGULAR' });
  const b = totals.batting[key], p = totals.pitching[key], t = totals.teams[team], lines: Line[] = [];
  if (b && player.kind === 'HITTER') {
   const r = battingRates(b);
   lines.push(
    {label:'경기',value:String(b.games)},
    {label:'안타',value:String(b.H)},
    {label:'홈런',value:String(b.HR)},
    {label:'타점',value:String(b.RBI)},
    {label:'타율',value:rate(r.AVG)},
    {label:'출루율',value:rate(r.OBP)},
    {label:'장타율',value:rate(r.SLG)},
    {label:'OPS',value:rate(r.OPS)},
   );
  }
  if (p && player.kind === 'PITCHER') {
   const r = pitchingRates(p);
   lines.push(
    {label:'경기',value:String(p.games)},
    {label:'승',value:String(p.W)},
    {label:'세이브',value:String(p.SV)},
    {label:'홀드',value:String(p.HLD)},
    {label:'이닝',value:inningsDisplay(p.outs)},
    {label:'탈삼진',value:String(p.K)},
    {label:'평균자책점',value:rate(r.ERA)},
    {label:'WHIP',value:rate(r.WHIP)},
    {label:'K/9',value:rate(r.K9)},
   );
  }
  if (t) lines.push({label:'팀 성적',value:`${t.W}승 ${t.L}패 ${t.T}무`});
  if (lines.length) sections.push({title:`${league} 정규시즌`,lines});
 }
 const growth = c.seasonGrowth;
 if (growth?.finalized && growth.seasonKey === season && growth.playerKey === key) {
  sections.push({title:'능력 변화',lines:abilityKeys(player.kind).map(k => ({
   label:ABILITY_LABELS[k],
   value:((player.abilities[k]! - growth.seasonStart.abilities[k]!) / UNITS_PER_POINT).toFixed(2),
  }))});
 }
 if ('protagonistClubId' in c) {
  const payroll = c.agents?.kboPayroll?.filter(p => p.seasonKey === season);
  if (payroll?.length) sections.push({title:'시즌 보수',lines:[{
   label:'지급 총액',value:`${payroll.reduce((n,p) => n + p.lastGrossWon, 0).toLocaleString('ko-KR')}원`,
  }]});
 } else if ('mode' in c && c.season?.payroll.length) {
  sections.push({title:'시즌 보수',lines:[{label:'지급 총액',value:`$${c.season.paidUsd.toLocaleString('en-US')}`}]});
 }
 return {season,sections};
}
