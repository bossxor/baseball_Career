import {KBO_CLUBS,KBO_ROSTER_LIMITS,overall} from '@playball/rules';
import type {Difficulty} from '@playball/rules';
import type {ActiveKboRosterWorld} from './kbo-career-entry.js';
import {createKboRosterWorld} from './kbo-world.js';
import {assertKboRecruitmentWorld} from './kbo-draft.js';
import {createSeasonCalendar} from './season-calendar.js';
import {createKboSeasonSchedules} from './kbo-schedule.js';
import type {KboSeasonSchedule} from './kbo-schedule.js';
import {emptyRecordLedger} from './records.js';
import type {RecordLedger} from './records.js';
import {createHealthLedger} from './health.js';
import type {HealthLedger} from './health.js';
import {createStreams} from './rng.js';
import {leagueStandings} from './standings.js';
import {kboClubBalance} from './kbo-finance.js';
import {automaticFieldLineup,initialPositionFits,FIELD_POSITIONS} from './lineup.js';
import type {FieldPosition} from './lineup.js';
import {emptyBatting} from './stats.js';
import type {KboAiAssessments} from './kbo-ai-offseason.js';
import type {KboPostseason} from './kbo-postseason.js';
import type {KboRookieDraftReceipt} from './kbo-supply.js';
import type {KboRetiredPlayer} from './kbo-retirement.js';
import {nextKboFreeAgentYear} from './kbo-free-agents.js';
import type {KboFreeAgentPool} from './kbo-free-agents.js';
import {importArchivedPlayers} from './kbo-club-import.js';
import type {ClubImportReceipt,ClubImportRequest} from './kbo-club-import.js';
import type {SchoolDayLedger} from './high-school-day.js';
import type {KboPendingGame} from './kbo-progress.js';

/** 05 독립 구단 새 게임의 뿌리. 내 선수 없이 한 구단을 맡는다(내 선수 사용 OFF가 기본이며 보관 투입은 별도 단계).
 * 선수/구단 규칙·일정·재정은 프로 커리어와 같은 세계를 쓰고, 주인공 키는 없다. */
export interface KboClubGame {
 schemaVersion:1;revision:number;difficulty:Difficulty;world:ActiveKboRosterWorld;userClubId:string;startYear:number;
 creationKey:string;phase:'PRESEASON_SETUP'|'SEASON_PROGRESS'|'POSTSEASON_PROGRESS'|'SEASON_REVIEW';records:RecordLedger;health:HealthLedger;schedule:KboSeasonSchedule['leagues'];
 freeAgents:KboFreeAgentPool;imports:readonly ClubImportReceipt[];lineup?:{draft:ClubLineupDraft};
 seasonClose?:{receiptKey:string;seasonKey:string;npcGrowth:Record<string,{budgetUnits:number;gainedUnits:number;agingLossUnits:number}>};
 seasons?:readonly {seasonKey:string;championKey?:string|null;standings:readonly {rank:number;teamKey:string;W:number;L:number;T:number}[];seasonClose:NonNullable<KboClubGame['seasonClose']>}[];
 aiAssessments?:KboAiAssessments;aiOffseasons?:readonly {seasonKey:string;renewal:unknown;repair:unknown;rounds:unknown;userOfferCount:number}[];
 rookieDrafts?:readonly KboRookieDraftReceipt[];retiredPlayers?:readonly KboRetiredPlayer[];offerPlan?:readonly {playerKey:string;annualSalaryWon:number;years:number}[];
 postseason?:KboPostseason;postseasonProgress?:{postseason:KboPostseason;nextWorldDay:number;pendingGame:KboPendingGame|null};
 days?:SchoolDayLedger;progress?:{nextWorldDay:number;pendingGame:KboPendingGame|null};
}
export const KBO_CLUB_DEFAULT_START_YEAR=2027;

/** One atomic creation: the whole league is generated from the seed, no club gets a favorable distribution, and no
 * redraw exists (the creation key is derived from the inputs, so a retry returns the same game). */
export function createKboClubGame(input:{worldKey:string;seed:string;difficulty:Difficulty;clubId:string;startYear?:number;imports?:readonly ClubImportRequest[]}):KboClubGame {
 const startYear=input.startYear??KBO_CLUB_DEFAULT_START_YEAR;
 if(!Number.isSafeInteger(startYear) || !KBO_CLUBS.some(c=>c.id===input.clubId))throw new RangeError('INVALID_KBO_CLUB_GAME');
 const calendar=createSeasonCalendar(startYear),created=createKboRosterWorld({worldKey:input.worldKey,seasonKey:String(startYear),seed:input.seed,difficulty:input.difficulty});
 const world:ActiveKboRosterWorld={...created,status:'ACTIVE',calendar};assertKboRecruitmentWorld(world);
 const ids=world.clubs.map(c=>c.id);
 // The free-agent pool (floor 80) exists from day one; imports replace same-position players of my club and release them into it.
 const pool=nextKboFreeAgentYear({worldKey:input.worldKey,seed:input.seed,seasonKey:String(startYear),difficulty:input.difficulty,registeredKeys:Object.keys(world.players)});
 const imported=importArchivedPlayers(world,pool,input.clubId,input.imports??[],input.seed);
 const game:KboClubGame={schemaVersion:1,revision:0,difficulty:input.difficulty,world,userClubId:input.clubId,startYear,phase:'PRESEASON_SETUP',
  creationKey:JSON.stringify(['kbo-club-game',input.worldKey,input.seed,input.difficulty,input.clubId,startYear,(input.imports??[]).map(r=>[r.importDraftId,r.archive.archiveId,r.replaceKey])]),records:emptyRecordLedger(),
  health:createHealthLedger(createStreams(input.seed,JSON.stringify(['kbo-club-health',input.worldKey])).injury),schedule:createKboSeasonSchedules(ids,String(startYear),calendar),freeAgents:imported.pool,imports:imported.receipts};
 assertKboRecruitmentWorld(game.world);
 // 05: a pick that leaves the club unable to field a legal first team is refused, never silently repaired.
 if(imported.receipts.length && kboClubRosterIssues(game).length)throw new RangeError('IMPORT_COMPOSITION_INVALID');
 return game;
}

export type RosterIssue='ROSTER_TOO_SMALL'|'ROSTER_TOO_LARGE'|'FIRST_TEAM_SIZE'|'FIRST_TEAM_PITCHERS'|'FIRST_TEAM_CATCHERS'|'FIRST_TEAM_POSITION_GAP'|'FIRST_TEAM_INJURED';
/** 05: club 35..60, first team 28 (13 pitchers / 15 hitters by default, 10..15 pitchers allowed), two catchers and every
 * infield/outfield position. Returned as codes the screen turns into the next to-do. */
export function kboClubRosterIssues(game:Pick<KboClubGame,'world'|'userClubId'|'health'>):RosterIssue[] {
 const club=game.world.clubs.find(c=>c.id===game.userClubId)!,issues:RosterIssue[]=[],first=club.firstTeam.map(k=>game.world.players[k]!);
 if(club.roster.length<KBO_ROSTER_LIMITS.minimum)issues.push('ROSTER_TOO_SMALL');
 if(club.roster.length>KBO_ROSTER_LIMITS.maximum)issues.push('ROSTER_TOO_LARGE');
 if(first.length!==KBO_ROSTER_LIMITS.firstTeam)issues.push('FIRST_TEAM_SIZE');
 const pitchers=first.filter(p=>p.kind==='PITCHER').length,hitters=first.filter(p=>p.kind==='HITTER');
 if(pitchers<10 || pitchers>15)issues.push('FIRST_TEAM_PITCHERS');
 if(hitters.filter(p=>p.position==='C').length<2)issues.push('FIRST_TEAM_CATCHERS');
 if(FIELD_POSITIONS.some(pos=>!hitters.some(p=>p.position===pos)))issues.push('FIRST_TEAM_POSITION_GAP');
 if(club.firstTeam.some(k=>Object.hasOwn(game.health.injuries,k)))issues.push('FIRST_TEAM_INJURED');
 return issues;
}

/** S13 구단 홈 읽기: standings (all KBO clubs), my club's money, next game and the to-dos that stop play. */
export function kboClubHome(game:KboClubGame){
 const {world}=game,club=world.clubs.find(c=>c.id===game.userClubId)!,names=new Map(world.clubs.map(c=>[c.id,c.name]));
 const standings=leagueStandings(game.records,{seasonKey:world.seasonKey,leagueKey:'KBO',phase:'REGULAR'},world.clubs.map(c=>c.id),world.seed,world.worldKey);
 const played=new Set(Object.keys(game.records.games)),mine=game.schedule.KBO.filter(g=>(g.homeTeamKey===club.id || g.awayTeamKey===club.id) && !played.has(g.simulationKey)).sort((a,b)=>a.worldDay-b.worldDay || (a.simulationKey<b.simulationKey?-1:1))[0];
 const balance=kboClubBalance(world,club.id),issues=kboClubRosterIssues(game);
 return {
  club:{id:club.id,name:club.name},seasonKey:world.seasonKey,phase:game.phase,
  standings:standings.map(s=>({rank:s.rank,teamKey:s.teamKey,name:names.get(s.teamKey)!,games:s.games,W:s.W,L:s.L,T:s.T,mine:s.teamKey===club.id})),
  budget:{totalWon:balance.budgetWon,paidWon:club.paidSalaryWon,reservedWon:club.reservedSalaryWon,guaranteedWon:balance.guaranteedWon,availableWon:balance.availableWon},
  nextGame:mine?{worldDay:mine.worldDay,home:mine.homeTeamKey===club.id,opponentKey:mine.homeTeamKey===club.id?mine.awayTeamKey:mine.homeTeamKey,opponentName:names.get(mine.homeTeamKey===club.id?mine.awayTeamKey:mine.homeTeamKey)!}:null,
  todos:issues.map(code=>({code,blocking:true})),
 };
}

/** S14 선수단 읽기: every player of my club with first-team/Futures tier, health and contract. */
export function kboClubRoster(game:Pick<KboClubGame,'world'|'userClubId'|'health'>){
 const club=game.world.clubs.find(c=>c.id===game.userClubId)!,first=new Set(club.firstTeam);
 return club.roster.map(key=>{const p=game.world.players[key]!,c=game.world.contracts[key]!;
  return {playerKey:key,name:p.name,kind:p.kind,position:p.position,age:p.age,overall:overall(p.kind,p.abilities).display,tier:first.has(key)?'FIRST' as const:'FUTURES' as const,
   injured:Object.hasOwn(game.health.injuries,key),fatigue:p.fatigue,contract:{years:c.years,annualSalaryWon:c.annualSalaryWon,seasonKey:c.seasonKey}};
 }).sort((a,b)=>(a.tier===b.tier?0:a.tier==='FIRST'?-1:1) || (a.name<b.name?-1:a.name>b.name?1:0) || (a.playerKey<b.playerKey?-1:1));
}

export interface ClubLineupDraft {battingOrder:readonly string[];fielders:Readonly<Record<FieldPosition,string>>;dhKey:string;startingPitcher:string}
export type LineupIssue={code:'DUPLICATE_PLAYER'|'NOT_FIRST_TEAM'|'INJURED'|'LEFT_THROW_BLOCKED'|'BATTING_ORDER_MISMATCH'|'STARTER_NOT_PITCHER'|'STARTER_MUST_BE_SP';playerKey?:string;position?:string};
/** 05: position fit is 100 at the registered position; other positions carry a 0.5..1.0 defense multiplier (shown as a penalty). */
export const fitMultiplier=(fit:number)=>.5+.5*Math.min(100,Math.max(0,fit))/100;

/** S15 자동 편성: the 41/44 selector over healthy first-team hitters plus the next healthy starter in the rotation. */
export function autoClubLineup(game:Pick<KboClubGame,'world'|'userClubId'|'health'>):ClubLineupDraft {
 const club=game.world.clubs.find(c=>c.id===game.userClubId)!,players=club.firstTeam.map(k=>game.world.players[k]!),healthy=(k:string)=>!Object.hasOwn(game.health.injuries,k);
 const hit=automaticFieldLineup(players.filter(p=>p.kind==='HITTER').map(player=>({player,available:healthy(player.simulationKey),fits:initialPositionFits(player.position),recent:emptyBatting()})));
 const starters=players.filter(p=>p.kind==='PITCHER' && p.position==='SP' && healthy(p.simulationKey)).map(p=>p.simulationKey).sort(),fallback=players.filter(p=>p.kind==='PITCHER' && healthy(p.simulationKey)).map(p=>p.simulationKey).sort();
 const starter=(starters[0]??fallback[0]);if(!starter)throw new RangeError('NO_HEALTHY_KBO_PITCHER');
 return {battingOrder:hit.lineup,fielders:Object.fromEntries(hit.fielders.map(f=>[f.position,f.simulationKey])) as Record<FieldPosition,string>,dhKey:hit.dhKey,startingPitcher:starter};
}
/** Checks a hand-made lineup without changing anything; an empty list means it can be applied. */
export function validateClubLineup(game:Pick<KboClubGame,'world'|'userClubId'|'health'>,draft:ClubLineupDraft):LineupIssue[] {
 const club=game.world.clubs.find(c=>c.id===game.userClubId)!,issues:LineupIssue[]=[],seen=new Set<string>(),first=new Set(club.firstTeam);
 const slots:[string,string][]=[...FIELD_POSITIONS.map(p=>[p,draft.fielders[p]] as [string,string]),['DH',draft.dhKey]];
 for(const [position,key] of slots){
  const p=game.world.players[key];
  if(seen.has(key))issues.push({code:'DUPLICATE_PLAYER',playerKey:key,position});seen.add(key);
  if(!p || !first.has(key) || p.kind!=='HITTER'){issues.push({code:'NOT_FIRST_TEAM',playerKey:key,position});continue;}
  if(Object.hasOwn(game.health.injuries,key))issues.push({code:'INJURED',playerKey:key,position});
  if(p.throws==='L' && ['C','2B','3B','SS'].includes(position))issues.push({code:'LEFT_THROW_BLOCKED',playerKey:key,position});
 }
 if(draft.battingOrder.length!==9 || new Set(draft.battingOrder).size!==9 || draft.battingOrder.some(k=>!seen.has(k)))issues.push({code:'BATTING_ORDER_MISMATCH'});
 const sp=game.world.players[draft.startingPitcher];
 if(!sp || sp.kind!=='PITCHER' || !first.has(sp.simulationKey))issues.push({code:'STARTER_NOT_PITCHER',playerKey:draft.startingPitcher});
 else {
  if(Object.hasOwn(game.health.injuries,sp.simulationKey))issues.push({code:'INJURED',playerKey:sp.simulationKey,position:'SP'});
  // The game takes a non-SP starter only when no healthy SP exists.
  if(sp.position!=='SP' && club.firstTeam.some(k=>{const p=game.world.players[k]!;return p.kind==='PITCHER' && p.position==='SP' && !Object.hasOwn(game.health.injuries,k);}))issues.push({code:'STARTER_MUST_BE_SP',playerKey:sp.simulationKey});
 }
 return issues;
}

/** S15 적용: a lineup is stored only when it has no issue; it then plays every first-team game of my club until it is
 * cleared or becomes invalid (an injury), when the advance stops at the game instead of silently changing it. */
export function applyKboClubLineup(source:KboClubGame,expectedRevision:number,draft:ClubLineupDraft):KboClubGame {
 if(source.schemaVersion!==1 || source.revision!==expectedRevision)throw new RangeError('CLUB_GAME_REVISION_CHANGED');
 if(validateClubLineup(source,draft).length)throw new RangeError('CLUB_LINEUP_INVALID');
 return {...structuredClone(source),lineup:{draft:structuredClone(draft)},revision:source.revision+1};
}
export function clearKboClubLineup(source:KboClubGame,expectedRevision:number):KboClubGame {
 if(source.schemaVersion!==1 || source.revision!==expectedRevision)throw new RangeError('CLUB_GAME_REVISION_CHANGED');
 const next=structuredClone(source);delete next.lineup;next.revision++;return next;
}
