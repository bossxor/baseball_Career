import { battingRates, pitchingRates, inningsDisplay, recordTotals, leagueStandings, careerSeasonGrowthSummary } from '@playball/engine';
import type { HighSchoolCareer, KboCareer, UsCareer } from '@playball/engine';
import { ABILITY_LABELS, UNITS_PER_POINT } from '@playball/rules';
import type { SaveState } from './engine-command.js';

type Line = { label: string; value: string };
export type SeasonReview = { season: string; sections: { title: string; lines: Line[] }[] };

/** Project only committed regular-season records and settled ledger values. */
export function careerSeasonReview(state: SaveState): SeasonReview | null {
 const c = state.career as HighSchoolCareer | KboCareer | UsCareer | undefined;
 if (!c?.world || !c.records?.games) return null;
 const growth = careerSeasonGrowthSummary(c);
 const review = c.phaseContext.phase === 'SEASON_REVIEW';
 if (!review && !(growth?.finalized && !('protagonistClubId' in c) && !('protagonistOrganizationId' in c) && ['CAREER_ROUTE','NEXT_SEASON_READY'].includes(c.phaseContext.phase))) return null;
 const key = 'protagonistKey' in c ? c.protagonistKey : c.world.protagonistKey;
 const team = 'protagonistClubId' in c ? c.protagonistClubId
  : 'protagonistOrganizationId' in c ? c.protagonistOrganizationId : c.world.protagonistSchoolId;
 const player = c.world.players[key]; if (!player) return null;
 const season = c.world.seasonKey, sections: SeasonReview['sections'] = [];
 const leagues = review ? [...new Set(Object.values(c.records.games)
  .filter(g => g.scope.seasonKey === season && g.scope.phase === 'REGULAR' && (g.batting[key] || g.pitching[key] || g.teams[team]))
  .map(g => g.scope.leagueKey))] : [];
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
  const priorSeasons = [...new Set(Object.values(c.records.games)
   .filter(g => /^\d{4}$/.test(season) && /^\d{4}$/.test(g.scope.seasonKey)
    && g.scope.seasonKey < season && g.scope.leagueKey === league && g.scope.phase === 'REGULAR'
    && (player.kind === 'HITTER' ? Boolean(g.batting[key]) : Boolean(g.pitching[key])))
   .map(g => g.scope.seasonKey))];
  if (priorSeasons.length) {
   const prior = priorSeasons.map(seasonKey => recordTotals(c.records, {seasonKey, leagueKey:league, phase:'REGULAR'}));
   const highs: Line[] = [];
   if (b && player.kind === 'HITTER') for (const [field, label] of [['H','안타'],['HR','홈런'],['BB','볼넷']] as const) {
    const values = prior.flatMap(row => row.batting[key] ? [row.batting[key]![field]] : []);
    if (values.length && b[field] > Math.max(...values)) highs.push({label,value:String(b[field])+' CH'});
   }
   if (p && player.kind === 'PITCHER') for (const [field, label] of [['K','탈삼진'],['W','승'],['SV','세이브']] as const) {
    const values = prior.flatMap(row => row.pitching[key] ? [row.pitching[key]![field]] : []);
    if (values.length && p[field] > Math.max(...values)) highs.push({label,value:String(p[field])+' CH'});
   }
   if (highs.length) sections.push({title:`${league} 커리어 하이`,lines:highs});
  }
  if (t) lines.push({label:'팀 성적',value:`${t.W}승 ${t.L}패 ${t.T}무`});
  if (lines.length) sections.push({title:`${league} 정규시즌`,lines});
 }
 if (growth && growth.seasonKey === season) {
  sections.push({title:growth.finalized?'확정 능력 변화':'현재 능력 변화 (시즌 마감 전)',lines:growth.abilities.map(a => ({
   label:ABILITY_LABELS[a.ability as keyof typeof ABILITY_LABELS] ?? a.ability,
   value:(a.deltaUnits / UNITS_PER_POINT).toFixed(2),
  }))});
 }
 if (review && 'protagonistClubId' in c && c.postseason?.seasonKey === season) {
  const seedRank=c.postseason.seeds.indexOf(team);
  const rank=seedRank>=0?seedRank+1:leagueStandings(c.records,{seasonKey:season,leagueKey:'KBO',phase:'REGULAR'},c.world.clubs.map(club=>club.id),c.world.seed,c.world.worldKey).find(row=>row.teamKey===team)?.rank;
  if (rank) sections.push({title:'팀 순위',lines:[{label:'정규시즌',value:`${rank}위`}]});
 }
 if (review && ('protagonistClubId' in c || 'protagonistOrganizationId' in c)) {
  sections.push({title:'시즌 종료 등록',lines:[
   {label:'포지션',value:player.position},
   {label:'등록',value:'protagonistClubId' in c ? (c.registration.firstTeam?'KBO 1군':'KBO 2군') : c.registration.level},
  ]});
  const role = c.advice?.roleReviews.filter(r => r.seasonKey === season && r.outcome === 'ROLE_CHANGED').at(-1);
  if (role) sections.push({title:'역할 변화',lines:[{label:'확정 역할',value:role.targetRole}]});
  const receipts = c.agents?.income.filter(r => r.seasonKey === season) ?? [];
  for (const currency of ['KRW','USD'] as const) {
   const entries = receipts.filter(r => r.currency === currency);
   if (!entries.length) continue;
   const money = (n:number) => currency === 'KRW' ? `${n.toLocaleString('ko-KR')}원` : `$${n.toLocaleString('en-US')}`;
   const labels = {SALARY:'연봉 지급',SALARY_ADJUSTMENT:'연봉 정산',SIGNING_BONUS:'계약금'} as const;
   sections.push({title:`확정 보수 내역 (${currency})`,lines:[
    ...(['SALARY','SALARY_ADJUSTMENT','SIGNING_BONUS'] as const).filter(kind=>entries.some(r=>r.kind===kind)).map(kind=>({label:labels[kind],value:money(entries.filter(r=>r.kind===kind).reduce((sum,r)=>sum+r.gross,0))})),
    {label:'에이전트 수수료',value:money(entries.reduce((sum,r)=>sum+r.fee,0))},
    {label:'실수령',value:money(entries.reduce((sum,r)=>sum+r.net,0))},
   ]});
  }
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
