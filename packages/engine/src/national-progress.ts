import {refreshCareerAchievements} from './career-achievements.js';
import {auditCareerNationalDays,nationalDayEvidence} from './national-day-audit.js';
import {emptyPitchXpLedger} from './pitch-xp.js';
import type {Repertoire} from './repertoire.js';
import type {GamePitchDevelopment,GameState,PitchEntry,TeamSnapshot} from './types.js';
import {putGameContribution} from './records.js';
import type {KboCareer,KboNationalResume} from './kbo-career-entry.js';
import {assertKboCareerRevision} from './kbo-career-version.js';
import type {NationalLedger,NationalMedal,NationalTournament} from './kbo-national.js';
import {sealNationalCompetitionResult,queueNationalFirstAppearance} from './kbo-national.js';
import {assertNationalSelectionSnapshot,nationalLineupBatting} from './national-selection.js';
import {kboNationalCandidates} from './kbo-national-selection.js';
import {replaceNationalInjuryWithEmergency} from './national-injury-replacement.js';
import {assertNationalBracket,createNationalBracket,nextNationalMatch,prepareNationalMatch,advanceNationalMatch,nationalNationPreset,nationalInviteDeadlines,nationalMatchesOnDay} from './national-bracket.js';
import type {NationalBracket,NationalTournamentWindow,NationalMatch} from './national-bracket.js';
import {koreaNationalTeam,nationalControlTeam} from './national-tournament.js';
import {appearanceFatigue} from './lineup.js';
import {settleTeamGameHealth} from './health.js';
import {createKboSeasonSchedules} from './kbo-schedule.js';

const MASTERY_XP=[0,100_000,300_000,600_000,1_000_000,1_500_000] as const;
function ledger(c:KboCareer):NationalLedger {
 return c.national??{invitations:[],competitions:[],benefits:[]};
}
function openBracket(c:KboCareer,tournament:NationalTournament):NationalBracket|undefined {
 return ledger(c).brackets?.find(b=>b.tournament===tournament&&b.seasonKey===c.world.seasonKey&&b.worldKey===c.world.worldKey);
}
function replaceBracket(c:KboCareer,bracket:NationalBracket):void {
 const cur=ledger(c),brackets=(cur.brackets??[]).map(b=>b.competitionId===bracket.competitionId?bracket:b);
 c.national={...cur,brackets:brackets.some(b=>b.competitionId===bracket.competitionId)?brackets:[...brackets,bracket]};
}
function ephemeralBook(entries:readonly PitchEntry[],seasonId:string):Repertoire {
 return {book:Object.fromEntries(entries.map(e=>[e.pitchId,MASTERY_XP[e.mastery]!])),weights:Object.fromEntries(entries.map(e=>[e.pitchId,e.weight])),ledger:emptyPitchXpLedger(),seasonId,usedWindows:[],learning:null};
}
function pitchDevelopment(c:KboCareer,teams:readonly [TeamSnapshot,TeamSnapshot]):GamePitchDevelopment {
 const players:GamePitchDevelopment['players']=Object.create(null);
 for(const pitcher of teams.flatMap(t=>t.pitchers)){
  const key=pitcher.simulationKey,real=c.world.repertoires[key]??c.sangmu?.members[key]?.repertoire;
  const numerator=key===c.protagonistKey?(c.difficulty==='SECRET_CHEAT'?15:5):(c.difficulty==='REALISTIC'?6:5);
  players[key]={repertoire:real?structuredClone(real):ephemeralBook(pitcher.repertoire,c.world.seasonKey),numerator};
 }
 return {seasonKey:c.world.seasonKey,players};
}
function teamFor(c:KboCareer,id:string,bracket:NationalBracket,koreaGames:number):TeamSnapshot {
 const strength=nationalNationPreset(bracket.tournament).find(n=>n.id===id)!.strength;
 if(id!=='KOR')return nationalControlTeam(id,strength);
 const selection=ledger(c).selections?.find(s=>s.seasonKey===c.world.seasonKey&&s.tournament===bracket.tournament);
 if(!selection)throw new RangeError('NATIONAL_SELECTION_REQUIRED');
 assertNationalSelectionSnapshot(selection);
 return koreaNationalTeam(c,selection,koreaGames,nationalLineupBatting(c.records,selection),bracket.dayCloseVersion===1&&c.phaseContext.phase==='INTERNATIONAL_PROGRESS'?c.phaseContext.nextWorldDay:undefined);
}
function koreaGameProgress(bracket:NationalBracket):{count:number;lastStage:NationalMatch['stage']|null} {
 let replay:NationalBracket={...createNationalBracket({worldKey:bracket.worldKey,seasonKey:bracket.seasonKey,tournament:bracket.tournament,seed:bracket.seed,...(bracket.window.basis==='P12_POSTSEASON'?{window:bracket.window}:{})}),results:[],pendingGame:null},n=0,lastStage:NationalMatch['stage']|null=null;
 for(const r of bracket.results){const m=nextNationalMatch(replay);if(!m)break;if(m.away==='KOR'||m.home==='KOR'){n++;lastStage=m.stage;}replay={...replay,results:[...replay.results,r]};}
 return {count:n,lastStage};
}
function koreaOutcome(bracket:NationalBracket):{medal:NationalMedal;finalRank:number} {
 let replay:NationalBracket={...createNationalBracket({worldKey:bracket.worldKey,seasonKey:bracket.seasonKey,tournament:bracket.tournament,seed:bracket.seed,...(bracket.window.basis==='P12_POSTSEASON'?{window:bracket.window}:{})}),results:[],pendingGame:null};
 const rows:{stage:string;away:string;home:string;winner:string}[]=[];
 for(const r of bracket.results){const m=nextNationalMatch(replay)!;rows.push({stage:m.stage,away:m.away,home:m.home,winner:r.winner});replay={...replay,results:[...replay.results,r]};}
 const final=rows.find(m=>m.stage==='FINAL')!,bronze=rows.find(m=>m.stage==='BRONZE'),semis=rows.filter(m=>m.stage==='SF');
 if(final.winner==='KOR')return {medal:'GOLD',finalRank:1};
 if(final.away==='KOR'||final.home==='KOR')return {medal:'SILVER',finalRank:2};
 if(bronze?.winner==='KOR')return {medal:'BRONZE',finalRank:3};
 if(bronze&&(bronze.away==='KOR'||bronze.home==='KOR'))return {medal:null,finalRank:4};
 if(semis.some(m=>m.away==='KOR'||m.home==='KOR'))return {medal:null,finalRank:4};
 return {medal:null,finalRank:Math.min({WBC:20,OLY:6,AG:8,P12:12}[bracket.tournament],5)};
}
function commitPitchXp(c:KboCareer,game:GameState):void {
 if(!game.pitchDevelopment)return;
 c.world={...c.world,repertoires:{...c.world.repertoires}};
 if(c.sangmu)c.sangmu={...c.sangmu,members:{...c.sangmu.members}};
 for(const [key,entry] of Object.entries(game.pitchDevelopment.players)){
  const member=c.sangmu?.members[key];
  if(member?.repertoire){c.sangmu={...c.sangmu!,members:{...c.sangmu!.members,[key]:{...member,repertoire:structuredClone(entry.repertoire)}}};continue;}
  if(Object.hasOwn(c.world.repertoires,key))c.world.repertoires[key]=structuredClone(entry.repertoire);
 }
}

/** Opens one DX bracket on the career ledger. World play continues even if the protagonist declined or was not selected. */
export function startNationalTournament(c:KboCareer,revision:number,tournament:NationalTournament,window?:NationalTournamentWindow):KboCareer {
 assertKboCareerRevision(c,revision);
 if(['ARCHIVED','RETIRE_CONFIRM'].includes(c.phaseContext.phase)||c.phaseContext.phase==='SEASON_PROGRESS'&&c.phaseContext.pendingGame||c.phaseContext.phase==='POSTSEASON_PROGRESS'&&c.phaseContext.pendingGame)throw new RangeError('NATIONAL_TOURNAMENT_NOT_AVAILABLE');
 const selection=ledger(c).selections?.find(s=>s.seasonKey===c.world.seasonKey&&s.tournament===tournament);if(!selection)throw new RangeError('NATIONAL_SELECTION_REQUIRED');
 assertNationalSelectionSnapshot(selection);
 const openInvite=ledger(c).invitations.find(i=>i.tournament===tournament&&i.seasonKey===c.world.seasonKey&&i.status==='INVITED');
 if(openInvite)throw new RangeError('NATIONAL_INVITE_RESPONSE_REQUIRED');
 const competitionId=JSON.stringify(['national-'+tournament.toLowerCase(),c.world.worldKey,c.world.seasonKey]);
 if(ledger(c).competitions.some(x=>x.competitionId===competitionId)||openBracket(c,tournament))throw new RangeError('NATIONAL_TOURNAMENT_ALREADY_STARTED');
 const bracket=createNationalBracket({worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,tournament,seed:`${c.world.seed}:national:${tournament}:${c.world.seasonKey}`,...(window?{window}:{})});
 assertNationalBracket(bracket);
 if(!['PRESEASON_SETUP','SEASON_PROGRESS','SEASON_REVIEW'].includes(c.phaseContext.phase))throw new RangeError('NATIONAL_TOURNAMENT_NOT_AVAILABLE');
 if(c.seasonClose||c.health.closedSeasons.includes(c.world.seasonKey))throw new RangeError('NATIONAL_SEASON_ALREADY_CLOSED');
 if(c.phaseContext.phase==='PRESEASON_SETUP'&&(tournament!=='WBC'||c.openingRoster||c.preseasonPlan))throw new RangeError('NATIONAL_CALENDAR_NOT_READY');
 if(tournament==='WBC'&&createKboSeasonSchedules(c.world.clubs.map(t=>t.id),c.world.seasonKey,c.world.calendar).KBO.some(g=>g.worldDay<bracket.window.endDay))throw new RangeError('NATIONAL_PRESEASON_DATE_CONFLICT');
 if(c.phaseContext.phase==='SEASON_PROGRESS'&&(c.phaseContext.nextWorldDay!==bracket.window.startDay||!c.days||c.days.days.at(-1)?.day!==bracket.window.startDay-1))throw new RangeError('NATIONAL_CALENDAR_NOT_READY');
 if(c.phaseContext.phase==='SEASON_REVIEW'&&(tournament!=='P12'||!c.postseason?.championKey||c.days?.days.at(-1)?.day===undefined||c.days.days.at(-1)!.day>=bracket.window.startDay))throw new RangeError('NATIONAL_CALENDAR_NOT_READY');
 if(tournament==='P12'){
  if(bracket.window.basis!=='P12_POSTSEASON'||!bracket.window.evidence)throw new RangeError('NATIONAL_PS_END_REQUIRED');
  const evidence=JSON.parse(bracket.window.evidence) as unknown[],last=Math.max(-1,...Object.values(c.records.games).filter(g=>g.scope.seasonKey===c.world.seasonKey&&g.scope.leagueKey==='KBO'&&g.scope.phase==='POSTSEASON').map(g=>g.worldDay));
  if(last<0||evidence[2]!==last||c.days?.days.at(-1)?.day!==last)throw new RangeError('NATIONAL_PS_END_CHANGED');
 }
 if(c.competitionSchedule&&Object.values(c.competitionSchedule.leagues).flat().some(g=>g.worldDay>=bracket.window.startDay&&g.worldDay<bracket.window.endDay))throw new RangeError('NATIONAL_DOMESTIC_COLLISION');
 if(c.health.games.some(g=>g.evidence.seasonKey===c.world.seasonKey&&g.evidence.day>=bracket.window.startDay))throw new RangeError('NATIONAL_HEALTH_CLOCK_AHEAD');
 bracket.dayCloseVersion=1;bracket.dayReceipts=[];bracket.fatigueSettledDays=[];
 const deadlines=nationalInviteDeadlines(bracket.window);
 const invitations=ledger(c).invitations.map(i=>i.tournament===tournament&&i.seasonKey===c.world.seasonKey&&(i.inviteDay===undefined||window?.basis==='P12_POSTSEASON')?{...i,...deadlines}:i);
 const next:KboCareer={...c,phaseContext:{phase:'INTERNATIONAL_PROGRESS',competitionId:bracket.competitionId,nextWorldDay:bracket.window.startDay,resume:structuredClone(c.phaseContext as KboNationalResume)},national:{...ledger(c),invitations,brackets:[...(ledger(c).brackets??[]),bracket]}};next.revision++;return next;
}

/** After every FINAL match on a world day, settle Korea roster fatigue once, then tick injury remainingTeamGames only for each completed Korea national game. Does not call KBO day closer. */
export function closeCareerNationalDay(c:KboCareer,revision:number,day:number):KboCareer {
 assertKboCareerRevision(c,revision);if(!Number.isSafeInteger(day)||day<0)throw new RangeError('INVALID_NATIONAL_DAY');
 const phase=c.phaseContext.phase==='INTERNATIONAL_PROGRESS'?c.phaseContext:null;
 const bracket=(ledger(c).brackets??[]).find(b=>{
  if(phase)return b.competitionId===phase.competitionId;
  if(b.seasonKey!==c.world.seasonKey||b.worldKey!==c.world.worldKey)return false;
  if(b.fatigueSettledDays?.includes(day))return true;
  const row=nationalMatchesOnDay(b,day);return row.completed.length>0||row.blocked;
 });
 if(!bracket)throw new RangeError('NATIONAL_DAY_NOT_OPEN');
 assertNationalBracket(bracket);if(bracket.fatigueSettledDays?.includes(day))throw new RangeError('NATIONAL_DAY_ALREADY_SETTLED');
 if(bracket.dayCloseVersion===1&&(!phase||phase.nextWorldDay!==day||day<bracket.window.startDay||day>=bracket.window.endDay))throw new RangeError('NATIONAL_DAY_OUT_OF_ORDER');
 if(bracket.dayCloseVersion===1)auditCareerNationalDays(c);
 if(bracket.fatigueSettledDays?.includes(day))throw new RangeError('NATIONAL_DAY_ALREADY_SETTLED');
 const {completed,blocked}=nationalMatchesOnDay(bracket,day);if(blocked)throw new RangeError('NATIONAL_DAY_GAMES_PENDING');if(!completed.length&&bracket.dayCloseVersion!==1)throw new RangeError('NATIONAL_DAY_NO_GAMES');
 const koreaGames=completed.filter(m=>m.away==='KOR'||m.home==='KOR');
 const selection=ledger(c).selections?.find(s=>s.seasonKey===c.world.seasonKey&&s.tournament===bracket.tournament);if(!selection)throw new RangeError('NATIONAL_SELECTION_REQUIRED');
 assertNationalSelectionSnapshot(selection);
 const next:KboCareer={...c,world:{...c.world,players:{...c.world.players}},...(c.sangmu?{sangmu:{...c.sangmu,...(c.sangmu.emergency?{emergency:{...c.sangmu.emergency,entries:{...c.sangmu.emergency.entries}}}:{})}}:{})};
 const playerOf=(key:string)=>next.world.players[key]??next.sangmu?.members[key]?.player;
 const rank=(kind:'NONE'|'HITTER'|'STARTER'|'RELIEF')=>({NONE:0,HITTER:1,RELIEF:2,STARTER:3}[kind]);
 const selected=new Set(selection.roster.slots.map(s=>s.playerKey));
 const keys=bracket.dayCloseVersion===1?[...new Set([...Object.keys(next.world.players),...Object.keys(next.sangmu?.members??{}),...Object.keys(next.sangmu?.emergency?.entries??{})])]:[...selected];
 for(const key of keys){
  const temporary=next.sangmu?.emergency?.entries[key],player=playerOf(key)??temporary?.player;if(!player)throw new RangeError('NATIONAL_ROSTER_CHANGED');
  let appearance:'NONE'|'HITTER'|'STARTER'|'RELIEF'='NONE';
  for(const m of selected.has(key)?koreaGames:[]){
   const g=next.records.games[m.gameKey];if(!g)throw new RangeError('NATIONAL_GAME_RECORD_MISSING');
   if(player.kind==='HITTER'&&(g.batting[key]?.PA??0)>0){if(rank('HITTER')>rank(appearance))appearance='HITTER';}
   else if(player.kind==='PITCHER'&&(g.pitching[key]?.BF??0)>0){const kind=(g.pitching[key]!.starts??0)>0?'STARTER':'RELIEF';if(rank(kind)>rank(appearance))appearance=kind;}
  }
  const refreshed=appearanceFatigue(player,appearance);
  if(next.sangmu?.members[key])next.sangmu={...next.sangmu,members:{...next.sangmu.members,[key]:{...next.sangmu.members[key]!,player:refreshed}}};
  else if(temporary)next.sangmu!.emergency!.entries[key]={...temporary,player:refreshed};
  else next.world.players[key]=refreshed;
 }
 const roster=selection.roster.slots.map(s=>s.playerKey).sort();if(roster.some(k=>!playerOf(k)))throw new RangeError('NATIONAL_ROSTER_CHANGED');
 const result={injured:[] as string[],recovered:[] as string[]};
 for(const m of koreaGames){
  const g=next.records.games[m.gameKey]!;
  const appearances=roster.filter(k=>(g.batting[k]?.PA??0)+(g.pitching[k]?.BF??0)>0).map(playerKey=>({playerKey,riskFatigue:playerOf(playerKey)!.fatigue}));
  const settled=settleTeamGameHealth(next.health,{gameKey:m.gameKey,teamKey:`${bracket.tournament}:KOR`,seasonKey:next.world.seasonKey,day,roster,appearances});
  next.health=settled.ledger;result.injured.push(...settled.result.injured);result.recovered.push(...settled.result.recovered);
 }
 result.injured.sort();result.recovered.sort();
 const gameKeys=completed.map(m=>m.gameKey),receipt={day,gameKeys,rosterKeys:roster,result};
 replaceBracket(next,{...bracket,fatigueSettledDays:[...(bracket.fatigueSettledDays??[]),day].sort((a,b)=>a-b),...(bracket.dayCloseVersion===1?{dayReceipts:[...(bracket.dayReceipts??[]),receipt]}:{})});
 if(phase){
  next.phaseContext={...phase,nextWorldDay:day+1};
  if(phase.resume.phase==='SEASON_PROGRESS'){
   if(!c.days||c.days.days.at(-1)?.day!==day-1)throw new RangeError('NON_CHRONOLOGICAL_PRO_DAY');
   next.days={...c.days,days:[...c.days.days,{day,evidence:nationalDayEvidence(bracket,day,gameKeys,roster),result}]};
  }
  auditCareerNationalDays(next);
  if(day+1===bracket.window.endDay){
   if(nextNationalMatch(bracket)||bracket.pendingGame)throw new RangeError('NATIONAL_DAY_GAMES_PENDING');
   next.phaseContext={...phase,phase:'INTERNATIONAL_REVIEW',nextWorldDay:day+1};
   return sealCareerTournament(next,revision,bracket);
  }
 }
 next.revision++;return next;
}

export function prepareCareerNationalMatch(c:KboCareer,revision:number):KboCareer {
 assertKboCareerRevision(c,revision);
 const bracket=(ledger(c).brackets??[]).find(b=>b.seasonKey===c.world.seasonKey&&b.worldKey===c.world.worldKey&&(b.pendingGame||nextNationalMatch(b)));
 if(!bracket)throw new RangeError('NATIONAL_TOURNAMENT_NOT_OPEN');
 assertNationalBracket(bracket);if(bracket.pendingGame)throw new RangeError('NATIONAL_GAME_ALREADY_PENDING');
 const m=nextNationalMatch(bracket)!;
 if(bracket.dayCloseVersion===1&&(c.phaseContext.phase!=='INTERNATIONAL_PROGRESS'||c.phaseContext.competitionId!==bracket.competitionId||c.phaseContext.nextWorldDay!==m.day))throw new RangeError('NATIONAL_DAY_CLOSE_REQUIRED');
 const progress=koreaGameProgress(bracket);let staged=c;
 if(bracket.dayCloseVersion===1&&(m.away==='KOR'||m.home==='KOR')&&(progress.count===0||progress.lastStage!==m.stage)){
  const selection=ledger(c).selections?.find(s=>s.seasonKey===c.world.seasonKey&&s.tournament===bracket.tournament);if(!selection)throw new RangeError('NATIONAL_SELECTION_REQUIRED');
  const unavailable=new Set(Object.keys(c.health.injuries));let repaired=selection;
  for(const slot of selection.roster.slots)if(unavailable.has(slot.playerKey))repaired=replaceNationalInjuryWithEmergency({selection:repaired,worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,seed:c.world.seed,candidates:kboNationalCandidates(c),records:c.records},slot.playerKey,unavailable);
  if(repaired!==selection)staged={...c,national:{...ledger(c),selections:ledger(c).selections!.map(s=>s.selectionId===selection.selectionId?repaired:s)}};
 }
 const teams:[TeamSnapshot,TeamSnapshot]=[teamFor(staged,m.away,bracket,progress.count),teamFor(staged,m.home,bracket,progress.count+(m.away==='KOR'?1:0))];
 const next:KboCareer={...staged};replaceBracket(next,prepareNationalMatch(bracket,teams,pitchDevelopment(staged,teams)));next.revision++;return next;
}

export type NationalProgressStop='CHUNK_LIMIT'|'ENGINE_LIMIT'|'GAME_FINAL'|'TOURNAMENT_COMPLETE';
export function advanceCareerNationalMatch(c:KboCareer,revision:number,maxPlateAppearances=1000):{career:KboCareer;stopReason:NationalProgressStop} {
 assertKboCareerRevision(c,revision);
 const bracket=(ledger(c).brackets??[]).find(b=>b.pendingGame&&b.seasonKey===c.world.seasonKey&&b.worldKey===c.world.worldKey);
 if(!bracket?.pendingGame)throw new RangeError('NATIONAL_GAME_NOT_PENDING');
 assertNationalBracket(bracket);
 if(bracket.dayCloseVersion===1&&(c.phaseContext.phase!=='INTERNATIONAL_PROGRESS'||c.phaseContext.competitionId!==bracket.competitionId||c.phaseContext.nextWorldDay!==nextNationalMatch(bracket)?.day))throw new RangeError('NATIONAL_DAY_CLOSE_REQUIRED');
 const out=advanceNationalMatch(bracket,maxPlateAppearances),next:KboCareer={...c};
 if(!out.contribution||!out.finalGame){replaceBracket(next,out.bracket);next.revision++;return {career:next,stopReason:out.stopReason==='ENGINE_LIMIT'?'ENGINE_LIMIT':'CHUNK_LIMIT'};}
 if(Object.hasOwn(next.records.games,out.contribution.gameKey))throw new RangeError('NATIONAL_GAME_ALREADY_RECORDED');
 next.records=putGameContribution(next.records,out.contribution).ledger;
 commitPitchXp(next,out.finalGame);
 replaceBracket(next,out.bracket);
 if(bracket.dayCloseVersion===1)queueNationalFirstAppearance(next,bracket.competitionId,out.contribution.gameKey);
 if(!next.achievements?.unlocks.some(u=>u.achievementId==='A04')&&((out.contribution.batting[next.protagonistKey]?.PA??0)+(out.contribution.pitching[next.protagonistKey]?.BF??0)>0))Object.assign(next,refreshCareerAchievements(next));
 if(out.stopReason!=='TOURNAMENT_COMPLETE'||bracket.dayCloseVersion===1){next.revision++;return {career:next,stopReason:'GAME_FINAL'};}
 return {career:sealCareerTournament(next,revision,out.bracket),stopReason:'TOURNAMENT_COMPLETE'};
}
function sealCareerTournament(next:KboCareer,revision:number,bracket:NationalBracket):KboCareer {
 const invite=ledger(next).invitations.find(i=>i.tournament===bracket.tournament&&i.seasonKey===next.world.seasonKey),selection=ledger(next).selections?.find(s=>s.seasonKey===next.world.seasonKey&&s.tournament===bracket.tournament);
 const registered=invite?.status==='ACCEPTED'||!!selection?.roster.slots.some(s=>s.playerKey===next.protagonistKey);
 const gameKeys=bracket.results.map(r=>r.gameKey),appeared=registered&&gameKeys.some(k=>{const g=next.records.games[k]!;return (g.batting[next.protagonistKey]?.PA??0)+(g.pitching[next.protagonistKey]?.BF??0)>0;});
 const {medal,finalRank}=koreaOutcome(bracket);
 return sealNationalCompetitionResult(next,revision,{competitionId:bracket.competitionId,tournament:bracket.tournament,seasonKey:next.world.seasonKey,medal,finalRank,officialAppearance:appeared,registered,resultVersion:1,gameKeys});
}
