import test from 'node:test';
import assert from 'node:assert/strict';
import {remainderDecisionCareer} from './remainder-fixtures.js';
import {enlistInActiveService,enlistInSangmu,completeKboMilitaryBlock} from '../src/kbo-military-program.js';
import {kboMilitaryCompletionDays} from '../src/kbo-military-events.js';
import {offerKboRemainderRenewal,compareKboRemainderOffers,kboRemainderRenewalView,acceptKboRemainderRenewal} from '../src/kbo-remainder-renewal.js';
import {acceptKboRemainderTransfer} from '../src/kbo-remainder-transfer.js';
import {advanceKboCareer,kboGameContext} from '../src/kbo-progress.js';
import {kboTeamGames} from '../src/kbo-windows.js';
import {kboMilitaryGrowthWindow,kboMilitaryRegisteredGames} from '../src/kbo-military-growth.js';
import {kboReturnConditionView,kboReturnConditionMultiplier,settleKboReturnConditionDay} from '../src/kbo-return-condition.js';
import {settleKboRemainderPayrollDay} from '../src/kbo-remainder-pay.js';
import {kboServiceTimeView} from '../src/kbo-service-time.js';
import {assertKboRecruitmentWorld} from '../src/kbo-draft.js';
import {canonicalJson} from '../src/game.js';
import {startKboPostseason,advanceKboPostseason} from '../src/kbo-postseason-progress.js';
import {settleKboSeasonGrowth} from '../src/kbo-season-growth.js';
import {closeKboSeason} from '../src/kbo-year-end.js';
import {offerKboRenewal,acceptKboRenewal} from '../src/kbo-renewal.js';
import {startNextKboSeason} from '../src/kbo-year-transition.js';
import {emptyBatting} from '../src/stats.js';

/** The common fixture plays the first resumed paid date. Add the matching explicit completed military history;
 * earlier service dates remain controlled clocks, while transfer and every next registered date run real commands. */
function completed(kind:'ACTIVE'|'SPORTS'){
 const c=remainderDecisionCareer(),key=c.protagonistKey,contract=c.world.contracts[key]!,year=Number(c.world.seasonKey),program=(kind==='ACTIVE'?enlistInActiveService:enlistInSangmu)({worldKey:c.world.worldKey,playerKey:key,clubId:c.protagonistClubId,selectionSeasonKey:String(year-2),contract,remainingPaidGameDays:1}),days=kboMilitaryCompletionDays(program),done=completeKboMilitaryBlock(completeKboMilitaryBlock(program,days[0]!.seasonKey,days[0]!.worldDay),days[1]!.seasonKey,days[1]!.worldDay),pay=contract.servicePay!;
 pay.kind=kind;pay.ledger.programId=program.programId;pay.ledger.resume={...pay.ledger.resume!,returnOptionId:done.returnOptionId!};
 c.schemaVersion=3;c.military={status:'COMPLETED',applications:[],program:done,completedSeasonKey:c.world.seasonKey,contractPaymentVersion:1,completionDays:days,growthPolicyVersion:1,...(kind==='ACTIVE'?{returnCondition:{programId:done.programId,returnSeasonKey:c.world.seasonKey,returnWorldDay:days[1]!.worldDay,gameKeys:pay.ledger.receipts.map(r=>r.gameKey)}}:{})};
 assertKboRecruitmentWorld(c.world);return c;
}

test('legacy SPORTS growth history cannot publish an unusable transfer or silently adopt a new growth policy',()=>{
 const c=completed('SPORTS'),key=c.protagonistKey;delete c.military!.growthPolicyVersion;
 const actual=Object.values(c.records.games).find(g=>g.scope.seasonKey===c.world.seasonKey && g.batting[key]);assert.ok(actual);
 // Old SPORTS saves can have official military appearances without military health-registration rows.
 const g=structuredClone(actual);g.gameKey='legacy-military-appearance';g.worldDay=c.competitionSchedule!.leagues.FUTURES[0]!.worldDay;g.scope={seasonKey:c.world.seasonKey,leagueKey:'FUTURES',phase:'REGULAR'};g.teams={SANGMU:{games:1,W:1,L:0,T:0,R:0,RA:0},LG:{games:1,W:0,L:1,T:0,R:0,RA:0}};g.batting={[key]:{...actual.batting[key]!,...emptyBatting(),PA:4,AB:4,K:4}};g.pitching={};g.batterSplits={};g.pitcherSplits={};g.matchups={};c.records.games[g.gameKey]=g;c.records.revision++;
 const o=offerKboRemainderRenewal(c,c.revision),v=kboRemainderRenewalView(o)!,compared=compareKboRemainderOffers(o,o.revision,{eventKey:v.eventKey,eventVersion:v.eventVersion}).career,offer=compared.remainderRenewal!.comparison!.offers[0]!,before=canonicalJson(compared);
 assert.throws(()=>acceptKboRemainderTransfer(compared,compared.revision,{eventKey:v.eventKey,eventVersion:v.eventVersion,offerKey:offer.offerKey}),/TRANSFER_REGISTRATION/);
 assert.equal(canonicalJson(compared),before);assert.equal(compared.military!.growthPolicyVersion,undefined);assert.equal(compared.remainderRenewal!.status,'OFFERED');
 const original=acceptKboRemainderRenewal(compared,compared.revision,{eventKey:v.eventKey,eventVersion:v.eventVersion});assert.equal(original.protagonistClubId,c.protagonistClubId);assert.equal(original.world.contracts[key]!.remainderPay!.schemaVersion,1);
});

for(const kind of ['ACTIVE','SPORTS'] as const)test(`actual ${kind} completed-service transfer preserves the original program and continues registered growth/pay${kind==='ACTIVE'?' and exactly six return games through next-year activation':''}`,()=>{
 const source=completed(kind),key=source.protagonistKey,oldClub=source.protagonistClubId,oldContract=structuredClone(source.world.contracts[key]!),oldMilitary=structuredClone(source.military!),sourceBefore=canonicalJson(source),oldHealth=structuredClone(source.health.games),offered=offerKboRemainderRenewal(source,source.revision),v=kboRemainderRenewalView(offered)!,compared=compareKboRemainderOffers(offered,offered.revision,{eventKey:v.eventKey,eventVersion:v.eventVersion}).career,offer=compared.remainderRenewal!.comparison!.offers[0]!;
 let c=acceptKboRemainderTransfer(compared,compared.revision,{eventKey:v.eventKey,eventVersion:v.eventVersion,offerKey:offer.offerKey});
 assert.equal(canonicalJson(source),sourceBefore);assert.deepEqual(c.military,oldMilitary);assert.deepEqual(c.world.contracts[key]!.remainderPay!.previous,oldContract);assert.equal(c.military!.program!.originalClubId,oldClub);assert.notEqual(c.protagonistClubId,oldClub);assert.equal(kboMilitaryGrowthWindow(c)!.kind,kind);assert.equal(kboTeamGames(c),oldContract.servicePay!.ledger.receipts.length);
 if(kind==='ACTIVE'){assert.equal(kboReturnConditionView(c)!.remainingTeamGames,5);assert.equal(kboGameContext(c,'FUTURES').conditionMultipliers![key],.95);}
 const needed=kind==='ACTIVE'?5:1;
 for(let i=0;i<900 && c.world.contracts[key]!.remainderPay!.receipts.length<needed;i++){
  const beforeCount=c.world.contracts[key]!.remainderPay!.receipts.length;if(kind==='ACTIVE')assert.equal(kboReturnConditionMultiplier(c),.95);
  c=advanceKboCareer(c,c.revision,1).career;
  if(kind==='ACTIVE')assert.equal(kboReturnConditionView(c)!.remainingTeamGames,5-c.world.contracts[key]!.remainderPay!.receipts.length);
  assert.ok(c.world.contracts[key]!.remainderPay!.receipts.length<=beforeCount+1);
 }
 assert.equal(c.world.contracts[key]!.remainderPay!.receipts.length,needed);assert.deepEqual(c.health.games.slice(0,oldHealth.length),oldHealth);assert.deepEqual(c.military!.program,oldMilitary.program);assert.deepEqual(c.military!.completionDays,oldMilitary.completionDays);assert.equal(kboTeamGames(c),1+needed);
 for(const [gameKey,game] of Object.entries(source.records.games))assert.deepEqual(c.records.games[gameKey],game);
 const newReceipts=c.world.contracts[key]!.remainderPay!.receipts;assert.ok(newReceipts.every(r=>c.health.games.some(h=>h.evidence.gameKey===r.gameKey && h.evidence.teamKey===r.leagueKey+':'+offer.clubId && h.evidence.roster.includes(key))));
 const snapshot=canonicalJson(c),day=c.days!.days.at(-1)!.day;settleKboRemainderPayrollDay(c,day);if(kind==='ACTIVE')settleKboReturnConditionDay(c,day);assert.equal(canonicalJson(c),snapshot);assertKboRecruitmentWorld(c.world);
 const kboRegistered=c.health.games.filter(h=>h.evidence.seasonKey===c.world.seasonKey && h.evidence.roster.includes(key) && c.records.games[h.evidence.gameKey]?.scope.leagueKey==='KBO').length;assert.equal(kboServiceTimeView(c).currentSeason.registeredGames,kboRegistered);
 if(kind!=='ACTIVE')return;
 assert.equal(kboReturnConditionMultiplier(c),1);assert.equal(kboReturnConditionView(c)!.remainingTeamGames,0);assert.deepEqual(c.military!.returnCondition!.gameKeys,[...oldMilitary.returnCondition!.gameKeys,...newReceipts.map(r=>r.gameKey)]);
 // Middle dates are controlled clocks. Final regular day, postseason, growth, closure and new year are real commands.
 const end=c.world.contracts[key]!.remainderPay!.endWorldDay,last=c.days!.days.at(-1)!.day;c.days!.days=[...c.days!.days,...Array.from({length:end-last-1},(_,i)=>({day:last+i+1,evidence:'controlled-military-transfer-clock',result:{injured:[],recovered:[]}}))];c.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:end,pendingGame:null};
 for(let i=0;i<160&&c.phaseContext.phase==='SEASON_PROGRESS';i++)c=advanceKboCareer(c,c.revision,1).career;assert.equal(c.phaseContext.phase,'SEASON_REVIEW');
 c=startKboPostseason(c,c.revision);for(let i=0;i<400;i++){const r=advanceKboPostseason(c,c.revision);c=r.career;if(r.stopReason==='POSTSEASON_COMPLETE')break;}
 c=settleKboSeasonGrowth(c,c.revision).career;assert.ok(c.seasonGrowth.entries.some(e=>e.period.ordinaryMilitary));assert.equal(settleKboSeasonGrowth(c,c.revision).duplicate,true);c=closeKboSeason(c,c.revision,true);
 const renewal=offerKboRenewal(c,c.revision),event=renewal.events.find(e=>e.eventKey===renewal.renewal!.eventKey)!,accepted=acceptKboRenewal(renewal,renewal.revision,{eventKey:event.eventKey,eventVersion:event.version}),next=startNextKboSeason(accepted,accepted.revision);
 assert.equal(next.schemaVersion,4);assert.equal(next.protagonistClubId,offer.clubId);assert.deepEqual(next.military,c.military);assert.equal(next.military!.program!.originalClubId,oldClub);assert.deepEqual(next.transferHistory,c.transferHistory);assert.equal(kboMilitaryGrowthWindow(next),null);assert.equal(kboMilitaryRegisteredGames(next),null);assert.equal(kboTeamGames(next),0);assert.equal(kboReturnConditionMultiplier(next),1);assert.deepEqual(next.contractHistory!.at(-1),c.world.contracts[key]);assertKboRecruitmentWorld(next.world);
});
