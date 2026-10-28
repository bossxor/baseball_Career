import {confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {startKboRegularSeason,advanceKboCareer} from '../src/kbo-progress.js';
import {auditCareerNationalDays} from '../src/national-day-audit.js';
import {confirmNationalEligibility} from '../src/kbo-national.js';
import {closeKboSeason} from '../src/kbo-year-end.js';
import {appearanceFatigue} from '../src/lineup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalJson} from '../src/game.js';
import {enteredKboCareer} from './fixtures.js';
import {abilityKeys} from '@playball/rules';
import {openKboNationalSelection,kboNationalSelectionView} from '../src/kbo-national-selection.js';
import {resolveKboNationalEvent} from '../src/kbo-national.js';
import {createNationalBracket,nationalCalendarWindow,p12ActualWindow,assertNationalBracket,nextNationalMatch,nationalInviteDeadlines} from '../src/national-bracket.js';
import {startNationalTournament,prepareCareerNationalMatch,advanceCareerNationalMatch,closeCareerNationalDay} from '../src/national-progress.js';
import type {KboCareer} from '../src/kbo-career-entry.js';
import {chooseNationalRoster,assertNationalSelectionSnapshot} from '../src/national-selection.js';

function acceptAg(c:KboCareer):KboCareer {

 const planned=confirmKboPreseasonPlan(c,c.revision),opening=confirmKboOpeningRoster(planned,planned.revision),scheduled=confirmKboSeasonSchedule(opening,opening.revision),active=startKboRegularSeason(scheduled,scheduled.revision);
 const start=nationalCalendarWindow(Number(c.world.seasonKey),'AG').startDay,first=active.phaseContext.phase==='SEASON_PROGRESS'?active.phaseContext.nextWorldDay:0;
 // Controlled pre-window prefix, not a played domestic season.
 c={...active,phaseContext:{phase:'SEASON_PROGRESS',nextWorldDay:start,pendingGame:null},days:{...active.days!,days:Array.from({length:start-first},(_,i)=>({day:first+i,evidence:'controlled-prefix',result:{injured:[],recovered:[]}}))}};
 const p=c.world.players[c.protagonistKey]!;p.abilities=Object.fromEntries(abilityKeys(p.kind).map(k=>[k,1_000_000]));p.potential={...p.abilities};p.careerPeaks={...p.abilities};
 const selected=openKboNationalSelection(c,c.revision,'AG'),e=selected.events.find(x=>x.definitionId==='E44')!;
 return resolveKboNationalEvent(selected,selected.revision,{eventKey:e.eventKey,eventVersion:e.version,command:'ACCEPT_NATIONAL'}).career;
}
function finishTournament(source:KboCareer):KboCareer {
 let c=source;
 for(let i=0;i<80;i++){
  const bracket=c.national!.brackets!.find(b=>b.tournament==='AG')!;
  if(c.phaseContext.phase==='INTERNATIONAL_REVIEW')return c;
  const phase=c.phaseContext;if(phase.phase==='INTERNATIONAL_PROGRESS'&&!bracket.pendingGame&&(!nextNationalMatch(bracket)||nextNationalMatch(bracket)!.day>phase.nextWorldDay)){const raw=canonicalJson(c);const next=closeCareerNationalDay(c,c.revision,phase.nextWorldDay);assert.equal(canonicalJson(c),raw);c=next;continue;}
  if(!bracket.pendingGame)c=prepareCareerNationalMatch(c,c.revision);
  const raw=canonicalJson(c),out=advanceCareerNationalMatch(c,c.revision);assert.equal(canonicalJson(c),raw);c=out.career;if(out.stopReason==='TOURNAMENT_COMPLETE')return c;
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
test('international phase closes every date once, audits shared pro days and resumes actual next domestic game after E48',()=>{
 const accepted=acceptAg(enteredKboCareer()),started=startNationalTournament(accepted,accepted.revision,'AG');
 assert.equal(started.phaseContext.phase,'INTERNATIONAL_PROGRESS');assert.throws(()=>advanceKboCareer(started,started.revision),/INVALID_CAREER_PHASE/);assert.throws(()=>closeKboSeason(started,started.revision),/INVALID_KBO_SEASON_CLOSE/);
 const forged=structuredClone(started);forged.phaseContext={phase:'SEASON_REVIEW'};assert.throws(()=>closeKboSeason(forged,forged.revision),/INVALID_NATIONAL_PHASE/);
 let done=finishTournament(JSON.parse(canonicalJson(started)) as KboCareer);const b=done.national!.brackets![0]!;assert.equal(b.dayReceipts!.length,14);assert.equal(b.fatigueSettledDays!.length,14);auditCareerNationalDays(done);
 assert.ok(b.dayReceipts!.some(d=>d.gameKeys.length===0));assert.ok(b.dayReceipts!.every(d=>done.days!.days.find(p=>p.day===d.day)?.evidence.includes('nationalDayVersion')));
 const bad=structuredClone(done);bad.national!.brackets![0]!.dayReceipts![0]!.result.injured.push('forged');assert.throws(()=>auditCareerNationalDays(bad),/CHANGED_NATIONAL_HEALTH|CHANGED_NATIONAL_PRO_DAY/);
 const e47=done.events.find(e=>e.definitionId==='E47'&&e.status==='OPEN');if(e47)done=confirmNationalEligibility(done,done.revision,String(e47.evidence.fields.competitionId));
 const e48=done.events.find(e=>e.definitionId==='E48'&&e.status==='OPEN')!;assert.equal(e48.occurredWorldDay,b.window.endDay-1);const raw=canonicalJson(done);
 let active=resolveKboNationalEvent(done,done.revision,{eventKey:e48.eventKey,eventVersion:e48.version,command:'CONFIRM_NATIONAL_RETURN'}).career;assert.equal(canonicalJson(done),raw);assert.equal(active.phaseContext.phase,'SEASON_PROGRESS');if(active.phaseContext.phase!=='SEASON_PROGRESS')throw Error('not resumed');assert.equal(active.phaseContext.nextWorldDay,b.window.endDay);
 assert.equal(canonicalJson(done.world.contracts),canonicalJson(accepted.world.contracts));const beforeCount=Object.keys(active.records.games).length;
 const nextGameDay=Math.min(...Object.values(active.competitionSchedule!.leagues).flat().filter(g=>g.worldDay>=b.window.endDay).map(g=>g.worldDay));
 for(let i=0;i<30&&active.days!.days.at(-1)!.day<nextGameDay;i++)active=advanceKboCareer(active,active.revision).career;
 assert.ok(Object.keys(active.records.games).length>beforeCount);assert.equal(active.days!.days.at(-1)!.day,nextGameDay);auditCareerNationalDays(active);
 console.log('M2-EE AG/return proof:',JSON.stringify({preWindow:'CONTROLLED_PREFIX',internationalGames:b.results.length,nationalDays:b.dayReceipts!.length,resumedDay:nextGameDay,actualDomesticGames:Object.keys(active.records.games).length-beforeCount}));
});
test('international rest days include nonparticipants once, refuse skipped days and preserve original world/records',()=>{
 const accepted=acceptAg(enteredKboCareer()),keys=new Set(accepted.national!.selections![0]!.roster.slots.map(s=>s.playerKey)),other=Object.values(accepted.world.players).find(p=>!keys.has(p.simulationKey))!;other.fatigue=40;
 let c=startNationalTournament(accepted,accepted.revision,'AG');if(c.phaseContext.phase!=='INTERNATIONAL_PROGRESS')throw Error('not started');const day=c.phaseContext.nextWorldDay;
 for(;;){const b=c.national!.brackets![0]!,m=nextNationalMatch(b);if(!m||m.day!==day)break;if(!b.pendingGame)c=prepareCareerNationalMatch(c,c.revision);c=advanceCareerNationalMatch(c,c.revision).career;}
 assert.throws(()=>closeCareerNationalDay(c,c.revision,day+1),/OUT_OF_ORDER/);const raw=canonicalJson(c),next=closeCareerNationalDay(c,c.revision,day);assert.equal(canonicalJson(c),raw);assert.equal(next.records,c.records);assert.equal(next.world.players[other.simulationKey]!.fatigue,appearanceFatigue(other,'NONE').fatigue);
 assert.throws(()=>prepareCareerNationalMatch(next,next.revision),/DAY_CLOSE_REQUIRED/);assert.throws(()=>closeCareerNationalDay(next,next.revision,day),/ALREADY_SETTLED/);
});
test('E46 queues at the first actual Korean FINAL before competition sealing and never duplicates after ACK or later games',()=>{
 const accepted=acceptAg(enteredKboCareer());let c=startNationalTournament(accepted,accepted.revision,'AG');assert.ok(!c.events.some(e=>e.definitionId==='E46'));
 let actual:string|undefined;
 for(let i=0;i<12&&!actual;i++){
  const b=c.national!.brackets![0]!,phase=c.phaseContext;if(phase.phase!=='INTERNATIONAL_PROGRESS')throw Error('not progressing');const m=nextNationalMatch(b)!;
  if(m.day>phase.nextWorldDay){c=closeCareerNationalDay(c,c.revision,phase.nextWorldDay);continue;}
  c=prepareCareerNationalMatch(c,c.revision);const partial=advanceCareerNationalMatch(c,c.revision,1);assert.ok(!partial.career.events.some(e=>e.definitionId==='E46'));c=advanceCareerNationalMatch(partial.career,partial.career.revision).career;
  actual=Object.values(c.records.games).find(g=>g.scope.phase==='INTERNATIONAL'&&(g.batting[c.protagonistKey]?.PA??0)+(g.pitching[c.protagonistKey]?.BF??0)>0)?.gameKey;
 }
 assert.ok(actual);const event=c.events.find(e=>e.definitionId==='E46')!;assert.ok(event,'first appearance must not wait for tournament result sealing');assert.equal(c.national!.competitions.length,0);assert.equal(event.occurredWorldDay,c.records.games[actual]!.worldDay);
 const ack=resolveKboNationalEvent(c,c.revision,{eventKey:event.eventKey,eventVersion:event.version,command:'ACK_EVENT'}).career;assert.equal(ack.world,c.world);assert.equal(ack.records,c.records);const done=finishTournament(ack);assert.equal(done.events.filter(e=>e.definitionId==='E46').length,1);
});

function nextKoreaGame(source:KboCareer,stage?:'GROUP'|'SF'):KboCareer {
 let c=source;
 for(let i=0;i<100;i++){
  if(c.phaseContext.phase!=='INTERNATIONAL_PROGRESS')throw Error('Korea did not reach requested stage');
  const b=c.national!.brackets![0]!,m=nextNationalMatch(b);
  if(!m||m.day>c.phaseContext.nextWorldDay){c=closeCareerNationalDay(c,c.revision,c.phaseContext.nextWorldDay);continue;}
  if((m.away==='KOR'||m.home==='KOR')&&(!stage||stage===m.stage))return c;
  c=advanceCareerNationalMatch(prepareCareerNationalMatch(c,c.revision),c.revision+1).career;
 }
 throw Error('Korea game limit');
}
test('first-game injury replaces one sealed roster slot before preparing Korea without rewriting draw, records or source',()=>{
 let c=acceptAg(enteredKboCareer());const key=c.protagonistKey;c=medicalNationalFixture(c,key,nationalCalendarWindow(Number(c.world.seasonKey),'AG').startDay-1);c=nextKoreaGame(startNationalTournament(c,c.revision,'AG'));
 const raw=canonicalJson(c),draw=canonicalJson(c.national!.brackets![0]!.groupMatches),scores=canonicalJson(c.national!.selections![0]!.scores),next=prepareCareerNationalMatch(c,c.revision),s=next.national!.selections![0]!;
 assert.ok(!s.roster.slots.some(s=>s.playerKey===key),'injured player must leave the actual registered roster');assert.equal(s.replacements.at(-1)!.from,key);assert.equal(s.replacements.at(-1)!.reason,'INJURED');assert.ok(next.world.players[s.replacements.at(-1)!.to]);assert.equal(canonicalJson(s.scores),scores);assert.equal(canonicalJson(next.national!.brackets![0]!.groupMatches),draw);assert.equal(next.records,c.records);assert.equal(canonicalJson(c),raw);
 const pending=canonicalJson(next);assert.throws(()=>prepareCareerNationalMatch(next,next.revision),/ALREADY_PENDING/);assert.equal(canonicalJson(next),pending);
 const done=finishTournament(next);assert.equal(done.national!.competitions[0]!.officialAppearance,false);assert.equal(done.military?.status??'UNRESOLVED','UNRESOLVED');auditCareerNationalDays(done);
});

/** Controlled medical snapshot with its required evidence; not a claim that RNG diagnosed this injury. */
function medicalNationalFixture(c:KboCareer,key:string,day:number):KboCareer {
 const gameKey='controlled-medical-'+day+'-'+key;
 return {...c,health:{...c.health,injuries:{...c.health.injuries,[key]:{severity:'MEDIUM',remainingTeamGames:30,diagnosedGameKey:gameKey,seasonKey:c.world.seasonKey}},games:[...c.health.games,{evidence:{gameKey,teamKey:'TEST:MEDICAL',seasonKey:c.world.seasonKey,day,roster:[key],appearances:[]},result:{injured:[key],recovered:[]}}]}};
}
test('injury cannot reshuffle an ongoing group; next round replaces once and preserves prior official appearance and JSON pending resume',()=>{
 let c=acceptAg(enteredKboCareer());const key=c.protagonistKey;
 // Controlled team strength ensures this fixed medical-boundary scenario reaches SF; results are actual games.
 for(const slot of c.national!.selections![0]!.roster.slots){const p=c.world.players[slot.playerKey]!;p.abilities=Object.fromEntries(abilityKeys(p.kind).map(k=>[k,slot.playerKey===key?1000000:900000]));p.potential={...p.abilities};p.careerPeaks={...p.abilities};}
 c=nextKoreaGame(startNationalTournament(c,c.revision,'AG'),'GROUP');c=advanceCareerNationalMatch(prepareCareerNationalMatch(c,c.revision),c.revision+1).career;
 const first=Object.values(c.records.games).find(g=>g.scope.phase==='INTERNATIONAL'&&(g.batting[key]?.PA??0)>0)!;assert.ok(first);const oldRecord=canonicalJson(first);
 while(c.phaseContext.phase==='INTERNATIONAL_PROGRESS'&&c.phaseContext.nextWorldDay<=first.worldDay){const m=nextNationalMatch(c.national!.brackets![0]!);if(!m||m.day>c.phaseContext.nextWorldDay)c=closeCareerNationalDay(c,c.revision,c.phaseContext.nextWorldDay);else c=advanceCareerNationalMatch(prepareCareerNationalMatch(c,c.revision),c.revision+1).career;}
 c=medicalNationalFixture(c,key,first.worldDay);
 c=nextKoreaGame(c,'GROUP');const before=c.national!.selections![0]!,sameGroup=prepareCareerNationalMatch(c,c.revision);assert.equal(sameGroup.national!.selections![0],before);assert.ok(before.roster.slots.some(s=>s.playerKey===key));c=advanceCareerNationalMatch(sameGroup,sameGroup.revision).career;
 c=nextKoreaGame(c,'SF');const raw=canonicalJson(c),prepared=prepareCareerNationalMatch(c,c.revision),selection=prepared.national!.selections![0]!;assert.ok(!selection.roster.slots.some(s=>s.playerKey===key));assert.equal(selection.replacements.filter(r=>r.from===key).length,1);assert.equal(canonicalJson(c),raw);
 const chunk=advanceCareerNationalMatch(prepared,prepared.revision,1).career,restored=JSON.parse(canonicalJson(chunk)) as KboCareer,full=advanceCareerNationalMatch(prepared,prepared.revision).career,resumed=advanceCareerNationalMatch(restored,restored.revision).career;assert.equal(canonicalJson(resumed.records),canonicalJson(full.records));
 const done=finishTournament(resumed);assert.equal(canonicalJson(done.records.games[first.gameKey]),oldRecord);assert.equal(done.national!.competitions[0]!.officialAppearance,true);assert.equal(done.national!.competitions[0]!.registered,true);assert.equal(done.events.filter(e=>e.definitionId==='E46').length,1);auditCareerNationalDays(done);
 console.log('M2-EH medical-boundary proof:',JSON.stringify({medical:'CONTROLLED',strength:'CONTROLLED_90_100',games:done.national!.brackets![0]!.results.length,withdrawn:selection.withdrawnKeys.includes(key),priorAppearance:true}));
});

test('exhausted healthy catcher pool rejects the whole replacement preparation without partial roster changes or invented players',()=>{
 let c=acceptAg(enteredKboCareer());const selection=c.national!.selections![0]!,selected=new Set(selection.roster.slots.map(s=>s.playerKey)),reserve=selection.scores.find(s=>s.position==='C'&&!selected.has(s.playerKey))!.playerKey,day=nationalCalendarWindow(Number(c.world.seasonKey),'AG').startDay-1;
 for(const row of selection.scores.filter(s=>s.position==='C'&&s.playerKey!==reserve))c=medicalNationalFixture(c,row.playerKey,day);
 c=nextKoreaGame(startNationalTournament(c,c.revision,'AG'));const raw=canonicalJson(c);assert.throws(()=>prepareCareerNationalMatch(c,c.revision),/NATIONAL_ROSTER_IMPOSSIBLE/);assert.equal(canonicalJson(c),raw);assert.equal(c.national!.selections![0]!.replacements.length,0);assert.equal(c.national!.brackets![0]!.pendingGame,null);
});

test('EH boundary admits a current lower-league emergency candidate after sealed exhaustion and protects its prepared pending game',()=>{
 let c=acceptAg(enteredKboCareer()),selection=c.national!.selections![0]!;
 // Controlled sealed-pool exhaustion and medical evidence, not a played domestic season or balance sample.
 const selected=new Set(selection.roster.slots.map(s=>s.playerKey)),scores=selection.scores.filter(s=>selected.has(s.playerKey));
 selection={...selection,scores,roster:chooseNationalRoster(scores)};c={...c,national:{...c.national!,selections:c.national!.selections!.map((row,i)=>i===0?selection:row)}};
 const key=selection.roster.slots.find(s=>s.role==='C')!.playerKey;
 c=medicalNationalFixture(c,key,nationalCalendarWindow(Number(c.world.seasonKey),'AG').startDay-1);
 c=nextKoreaGame(startNationalTournament(c,c.revision,'AG'));
 const raw=canonicalJson(c),bracket=c.national!.brackets![0]!,past=canonicalJson(bracket.results),players=canonicalJson(c.world.players),prepared=prepareCareerNationalMatch(c,c.revision),next=prepared.national!.selections![0]!;
 assert.equal(canonicalJson(c),raw);assert.equal(canonicalJson(prepared.world.players),players);assert.equal(prepared.records,c.records);
 assert.deepEqual(next.scores.slice(0,scores.length),scores);assert.equal(next.emergencyAdmissions!.length,1);assert.equal(next.replacements.length,1);
 const replacement=next.replacements[0]!.to;assert.ok(c.world.players[replacement]);assert.ok(!c.world.clubs.some(club=>club.firstTeam.includes(replacement)));
 const view=kboNationalSelectionView(prepared,'AG')!;assert.equal(view.roster.find(row=>row.playerKey===replacement)!.emergency,true);assert.ok(view.roster.filter(row=>row.playerKey!==replacement).every(row=>!row.emergency));
 assert.equal(canonicalJson(prepared.national!.brackets![0]!.results),past);assert.deepEqual(prepared.national!.brackets![0]!.groupMatches,bracket.groupMatches);
 const restored=JSON.parse(canonicalJson(prepared)) as KboCareer;assertNationalSelectionSnapshot(restored.national!.selections![0]!);
 const pending=canonicalJson(restored);assert.throws(()=>prepareCareerNationalMatch(restored,restored.revision),/ALREADY_PENDING/);assert.equal(canonicalJson(restored),pending);
});
