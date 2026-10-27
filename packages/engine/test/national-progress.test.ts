import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalJson} from '../src/game.js';
import {enteredKboCareer} from './fixtures.js';
import {abilityKeys} from '@playball/rules';
import {openKboNationalSelection} from '../src/kbo-national-selection.js';
import {resolveKboNationalEvent} from '../src/kbo-national.js';
import {createNationalBracket,nationalCalendarWindow,p12ActualWindow,assertNationalBracket,nextNationalMatch,nationalInviteDeadlines} from '../src/national-bracket.js';
import {startNationalTournament,prepareCareerNationalMatch,advanceCareerNationalMatch,closeCareerNationalDay} from '../src/national-progress.js';
import type {KboCareer} from '../src/kbo-career-entry.js';

function acceptAg(c:KboCareer):KboCareer {
 const p=c.world.players[c.protagonistKey]!;p.abilities=Object.fromEntries(abilityKeys(p.kind).map(k=>[k,1_000_000]));p.potential={...p.abilities};p.careerPeaks={...p.abilities};
 const selected=openKboNationalSelection(c,c.revision,'AG'),e=selected.events.find(x=>x.definitionId==='E44')!;
 return resolveKboNationalEvent(selected,selected.revision,{eventKey:e.eventKey,eventVersion:e.version,command:'ACCEPT_NATIONAL'}).career;
}
function finishTournament(source:KboCareer):KboCareer {
 let c=source;
 for(let i=0;i<80;i++){
  const bracket=c.national!.brackets!.find(b=>b.tournament==='AG')!;
  if(!nextNationalMatch(bracket)&&!bracket.pendingGame)return c;
  if(!bracket.pendingGame)c=prepareCareerNationalMatch(c,c.revision);
  const out=advanceCareerNationalMatch(c,c.revision);c=out.career;if(out.stopReason==='TOURNAMENT_COMPLETE')return c;
 }
 throw new Error('tournament did not finish');
}

test('p12ActualWindow uses max(nominal 11/15, both PS end+1) and keeps 14 days without rewriting calendar-1',()=>{
 const year=2027,nominal=nationalCalendarWindow(year,'P12');
 assert.equal(nominal.endDay-nominal.startDay,14);assert.equal(nominal.basis,'CALENDAR');
 const early=p12ActualWindow(year,{kboPostseasonEndDay:nominal.startDay-10,usPostseasonEndDay:nominal.startDay-20});
 assert.deepEqual({startDay:early.startDay,endDay:early.endDay},{startDay:nominal.startDay,endDay:nominal.endDay});
 const lateDay=nominal.startDay+5,late=p12ActualWindow(year,{kboPostseasonEndDay:lateDay,usPostseasonEndDay:lateDay-2});
 assert.equal(late.startDay,lateDay+1);assert.equal(late.endDay,late.startDay+14);assert.equal(late.basis,'P12_POSTSEASON');
 assert.equal(late.evidence,JSON.stringify(['p12-window-1',year,lateDay,lateDay-2]));
 const bracket=createNationalBracket({worldKey:'w',seasonKey:'2027',tournament:'P12',seed:'late',window:late});
 assert.equal(bracket.window.startDay,late.startDay);assert.equal(bracket.groupMatches[0]!.day,late.startDay);assertNationalBracket(JSON.parse(canonicalJson(bracket)));
 assert.deepEqual(nationalCalendarWindow(year,'P12'),nominal);
});

test('career AG bracket uses the sealed actual28 Korean identities and seals records after FINAL',()=>{
 const accepted=acceptAg(enteredKboCareer()),raw=canonicalJson(accepted),started=startNationalTournament(accepted,accepted.revision,'AG');
 assert.equal(canonicalJson(accepted),raw);assert.equal(started.national!.brackets!.length,1);
 const done=finishTournament(started),result=done.national!.competitions[0]!,keys=new Set(accepted.national!.selections![0]!.roster.slots.map(s=>s.playerKey));
 assert.equal(result.tournament,'AG');assert.equal(result.registered,true);assert.ok(result.gameKeys!.length>=16);
 const korGames=result.gameKeys!.map(k=>done.records.games[k]!).filter(g=>Object.hasOwn(g.teams,'KOR'));
 assert.ok(korGames.length>=3);
 for(const g of korGames){for(const key of Object.keys(g.batting).filter(k=>Object.hasOwn(accepted.world.players,k)))assert.ok(keys.has(key));assert.ok(!Object.keys(g.batting).some(k=>/^KOR-h/.test(k)));}
 assert.equal(result.officialAppearance,korGames.some(g=>(g.batting[accepted.protagonistKey]?.PA??0)+(g.pitching[accepted.protagonistKey]?.BF??0)>0));
 assert.throws(()=>startNationalTournament(done,done.revision,'AG'),/ALREADY/);
});

test('mid-tournament JSON resume keeps pendingGame and does not duplicate contributions',()=>{
 const accepted=acceptAg(enteredKboCareer());let c=startNationalTournament(accepted,accepted.revision,'AG');
 c=prepareCareerNationalMatch(c,c.revision);const mid=advanceCareerNationalMatch(c,c.revision,1);
 assert.equal(mid.stopReason,'CHUNK_LIMIT');assert.ok(mid.career.national!.brackets![0]!.pendingGame);
 const restored=JSON.parse(canonicalJson(mid.career)) as KboCareer;
 assert.equal(restored.national!.brackets![0]!.pendingGame!.input.simulationKey,mid.career.national!.brackets![0]!.pendingGame!.input.simulationKey);
 const finished=finishTournament(restored);
 assert.equal(finished.national!.competitions.length,1);
 assert.equal(new Set(finished.national!.competitions[0]!.gameKeys).size,finished.national!.competitions[0]!.gameKeys!.length);
 assert.equal(finished.records.revision,accepted.records.revision+finished.national!.competitions[0]!.gameKeys!.length);
});

test('invite deadlines seal 7/2/1 before start and national day fatigue settles once',()=>{
 const base=enteredKboCareer(),window=nationalCalendarWindow(Number(base.world.seasonKey),'AG'),deadlines=nationalInviteDeadlines(window);
 assert.deepEqual(deadlines,{inviteDay:window.startDay-7,responseDeadlineDay:window.startDay-2,finalRosterDay:window.startDay-1});
 const accepted=acceptAg(base),invite=accepted.national!.invitations.find(i=>i.tournament==='AG')!;
 assert.equal(invite.inviteDay,deadlines.inviteDay);assert.equal(invite.responseDeadlineDay,deadlines.responseDeadlineDay);
 let c=startNationalTournament(accepted,accepted.revision,'AG');const firstDay=c.national!.brackets![0]!.groupMatches[0]!.day;
 c=prepareCareerNationalMatch(c,c.revision);assert.throws(()=>closeCareerNationalDay(c,c.revision,firstDay),/PENDING/);
 for(;;){
  const b=c.national!.brackets![0]!,next=nextNationalMatch(b);
  if(b.pendingGame){c=advanceCareerNationalMatch(c,c.revision).career;continue;}
  if(!next||next.day!==firstDay)break;
  c=prepareCareerNationalMatch(c,c.revision);
 }
 const settled=closeCareerNationalDay(c,c.revision,firstDay);
 assert.ok(settled.national!.brackets![0]!.fatigueSettledDays!.includes(firstDay));
 assert.ok(settled.health.games.some(g=>g.evidence.teamKey==='AG:KOR'&&g.evidence.day===firstDay));
 assert.throws(()=>closeCareerNationalDay(settled,settled.revision,firstDay),/ALREADY_SETTLED/);
});
