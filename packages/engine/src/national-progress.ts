import {emptyPitchXpLedger} from './pitch-xp.js';
import type {Repertoire} from './repertoire.js';
import type {GamePitchDevelopment,GameState,PitchEntry,TeamSnapshot} from './types.js';
import {putGameContribution} from './records.js';
import type {KboCareer} from './kbo-career-entry.js';
import {assertKboCareerRevision} from './kbo-career-version.js';
import type {NationalLedger,NationalMedal,NationalTournament} from './kbo-national.js';
import {sealNationalCompetitionResult} from './kbo-national.js';
import {assertNationalSelectionSnapshot,nationalLineupBatting} from './national-selection.js';
import {assertNationalBracket,createNationalBracket,nextNationalMatch,prepareNationalMatch,advanceNationalMatch,nationalNationPreset} from './national-bracket.js';
import type {NationalBracket,NationalTournamentWindow} from './national-bracket.js';
import {koreaNationalTeam,nationalControlTeam} from './national-tournament.js';

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
 return koreaNationalTeam(c,selection,koreaGames,nationalLineupBatting(c.records,selection));
}
function koreaGameCount(bracket:NationalBracket):number {
 let replay:NationalBracket={...createNationalBracket({worldKey:bracket.worldKey,seasonKey:bracket.seasonKey,tournament:bracket.tournament,seed:bracket.seed,...(bracket.window.basis==='P12_POSTSEASON'?{window:bracket.window}:{})}),results:[],pendingGame:null},n=0;
 for(const r of bracket.results){const m=nextNationalMatch(replay);if(!m)break;if(m.away==='KOR'||m.home==='KOR')n++;replay={...replay,results:[...replay.results,r]};}
 return n;
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
 for(const [key,entry] of Object.entries(game.pitchDevelopment.players)){
  const member=c.sangmu?.members[key];
  if(member?.repertoire){member.repertoire=structuredClone(entry.repertoire);continue;}
  if(Object.hasOwn(c.world.repertoires,key))c.world.repertoires[key]=structuredClone(entry.repertoire);
 }
}

/** Opens one DX bracket on the career ledger. World play continues even if the protagonist declined or was not selected. */
export function startNationalTournament(c:KboCareer,revision:number,tournament:NationalTournament,window?:NationalTournamentWindow):KboCareer {
 assertKboCareerRevision(c,revision);
 if(['ARCHIVED','RETIRE_CONFIRM'].includes(c.phaseContext.phase)||c.phaseContext.phase==='SEASON_PROGRESS'&&c.phaseContext.pendingGame||c.phaseContext.phase==='POSTSEASON_PROGRESS'&&c.phaseContext.pendingGame)throw new RangeError('NATIONAL_TOURNAMENT_NOT_AVAILABLE');
 const selection=ledger(c).selections?.find(s=>s.seasonKey===c.world.seasonKey&&s.tournament===tournament);if(!selection)throw new RangeError('NATIONAL_SELECTION_REQUIRED');
 assertNationalSelectionSnapshot(selection);
 const competitionId=JSON.stringify(['national-'+tournament.toLowerCase(),c.world.worldKey,c.world.seasonKey]);
 if(ledger(c).competitions.some(x=>x.competitionId===competitionId)||openBracket(c,tournament))throw new RangeError('NATIONAL_TOURNAMENT_ALREADY_STARTED');
 const bracket=createNationalBracket({worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,tournament,seed:`${c.world.seed}:national:${tournament}:${c.world.seasonKey}`,...(window?{window}:{})});
 assertNationalBracket(bracket);
 const next:KboCareer={...c,national:{...ledger(c),brackets:[...(ledger(c).brackets??[]),bracket]}};next.revision++;return next;
}

export function prepareCareerNationalMatch(c:KboCareer,revision:number):KboCareer {
 assertKboCareerRevision(c,revision);
 const bracket=(ledger(c).brackets??[]).find(b=>b.seasonKey===c.world.seasonKey&&b.worldKey===c.world.worldKey&&(b.pendingGame||nextNationalMatch(b)));
 if(!bracket)throw new RangeError('NATIONAL_TOURNAMENT_NOT_OPEN');
 assertNationalBracket(bracket);if(bracket.pendingGame)throw new RangeError('NATIONAL_GAME_ALREADY_PENDING');
 const m=nextNationalMatch(bracket)!;const koreaGames=koreaGameCount(bracket);
 const teams:[TeamSnapshot,TeamSnapshot]=[teamFor(c,m.away,bracket,koreaGames),teamFor(c,m.home,bracket,koreaGames+(m.away==='KOR'?1:0))];
 const next:KboCareer={...c};replaceBracket(next,prepareNationalMatch(bracket,teams,pitchDevelopment(c,teams)));next.revision++;return next;
}

export type NationalProgressStop='CHUNK_LIMIT'|'ENGINE_LIMIT'|'GAME_FINAL'|'TOURNAMENT_COMPLETE';
export function advanceCareerNationalMatch(c:KboCareer,revision:number,maxPlateAppearances=1000):{career:KboCareer;stopReason:NationalProgressStop} {
 assertKboCareerRevision(c,revision);
 const bracket=(ledger(c).brackets??[]).find(b=>b.pendingGame&&b.seasonKey===c.world.seasonKey&&b.worldKey===c.world.worldKey);
 if(!bracket?.pendingGame)throw new RangeError('NATIONAL_GAME_NOT_PENDING');
 assertNationalBracket(bracket);
 const out=advanceNationalMatch(bracket,maxPlateAppearances),next:KboCareer={...c};
 if(!out.contribution||!out.finalGame){replaceBracket(next,out.bracket);next.revision++;return {career:next,stopReason:out.stopReason==='ENGINE_LIMIT'?'ENGINE_LIMIT':'CHUNK_LIMIT'};}
 if(Object.hasOwn(next.records.games,out.contribution.gameKey))throw new RangeError('NATIONAL_GAME_ALREADY_RECORDED');
 next.records=putGameContribution(next.records,out.contribution).ledger;
 commitPitchXp(next,out.finalGame);
 replaceBracket(next,out.bracket);
 if(out.stopReason!=='TOURNAMENT_COMPLETE'){next.revision++;return {career:next,stopReason:'GAME_FINAL'};}
 const invite=ledger(next).invitations.find(i=>i.tournament===out.bracket.tournament&&i.seasonKey===next.world.seasonKey),selection=ledger(next).selections?.find(s=>s.seasonKey===next.world.seasonKey&&s.tournament===out.bracket.tournament);
 const registered=invite?.status==='ACCEPTED'||!!selection?.roster.slots.some(s=>s.playerKey===next.protagonistKey);
 const gameKeys=out.bracket.results.map(r=>r.gameKey),appeared=registered&&gameKeys.some(k=>{const g=next.records.games[k]!;return (g.batting[next.protagonistKey]?.PA??0)+(g.pitching[next.protagonistKey]?.BF??0)>0;});
 const {medal,finalRank}=koreaOutcome(out.bracket);
 return {career:sealNationalCompetitionResult(next,revision,{competitionId:out.bracket.competitionId,tournament:out.bracket.tournament,seasonKey:next.world.seasonKey,medal,finalRank,officialAppearance:appeared,registered,resultVersion:1,gameKeys}),stopReason:'TOURNAMENT_COMPLETE'};
}
