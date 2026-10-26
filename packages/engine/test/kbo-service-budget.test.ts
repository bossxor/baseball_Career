import test from 'node:test';
import assert from 'node:assert/strict';
import {KBO_MONEY,abilityKeys} from '@playball/rules';
import {enteredKboCareer} from './fixtures.js';
import {startSangmuCohort} from '../src/kbo-sangmu-start.js';
import {assertKboRecruitmentWorld,prepareKboDraft,resolveKboDraft} from '../src/kbo-draft.js';
import {kboClubBalance,kboFutureCommitmentWon,kboPreservedServiceCommitmentWon,kboRecruitmentOpen} from '../src/kbo-finance.js';
import {nextKboFreeAgentYear} from '../src/kbo-free-agents.js';
import {runKboAiFreeAgentMarket} from '../src/kbo-fa-market.js';
import {prepareKboAiRenewals} from '../src/kbo-ai-offseason.js';
import {draftKboRookieClass} from '../src/kbo-supply.js';
import {offerKboRenewal,acceptKboRenewal} from '../src/kbo-renewal.js';
import {remainderDecisionCareer} from './remainder-fixtures.js';
import {enlistInSangmu,completeSangmuBlock} from '../src/kbo-military-program.js';
import {createKboServicePayroll,kboContractSeasonCharge} from '../src/kbo-service-payroll.js';
import {resumeKboContractPayments} from '../src/kbo-contract-payments.js';
import {offerKboRemainderRenewal,compareKboRemainderOffers,kboRemainderRenewalView} from '../src/kbo-remainder-renewal.js';
import {acceptKboRemainderTransfer} from '../src/kbo-remainder-transfer.js';
import {canonicalJson} from '../src/game.js';

let cached:ReturnType<typeof makeOverhang>|undefined;
/** Valid existing contracts fill the old limit; an actual new intake preserves its now-deferred salary. */
function makeOverhang(){
 const source=enteredKboCareer(),selection=startSangmuCohort(source,source.revision),selected=new Set(Object.keys(selection.world.suspendedContracts!));
 const club=source.world.clubs.find(t=>t.roster.some(k=>selected.has(k) && source.world.contracts[k]!.years===1))!;
 assert.ok(club);
 for(const key of club.roster)source.world.contracts[key]!.years=selected.has(key)?1:2;
 let delta=club.budgetWon*.9-kboFutureCommitmentWon(source.world,club.id,1);
 for(const key of club.roster){if(selected.has(key))continue;const c=source.world.contracts[key]!,n=Math.min(KBO_MONEY.maximumSalaryWon-c.annualSalaryWon,delta);c.annualSalaryWon+=n;club.reservedSalaryWon+=n;delta-=n;}
 assert.equal(delta,0);assertKboRecruitmentWorld(source.world);
 const career=startSangmuCohort(source,source.revision);
 return {source,career,clubId:club.id};
}
function fixture(){cached??=makeOverhang();return structuredClone(cached);}
function poolFor(c:ReturnType<typeof fixture>['career']){return nextKboFreeAgentYear({worldKey:c.world.worldKey,seed:c.world.seed,seasonKey:c.world.seasonKey,difficulty:c.difficulty,registeredKeys:Object.keys(c.world.players)});}

test('valid pre-intake obligations may cross90% only through preserved service principal, without issuing future support',()=>{
 const {source,career:c,clubId}=fixture(),club=c.world.clubs.find(t=>t.id===clubId)!;
 assert.equal(kboFutureCommitmentWon(source.world,clubId,1),club.budgetWon*.9);
 assert.ok(kboFutureCommitmentWon(c.world,clubId,1)>club.budgetWon*.9);
 assert.equal(kboFutureCommitmentWon(c.world,clubId,1)-kboPreservedServiceCommitmentWon(c.world,clubId,1),club.budgetWon*.9);
 assert.equal(kboRecruitmentOpen(c.world,clubId),false);assert.ok(kboClubBalance(c.world,clubId).availableWon>0);
 assertKboRecruitmentWorld(c.world);assert.deepEqual(c.world.finance?.grants??[],[]);
 for(const contract of Object.values(c.world.suspendedContracts!)){
  assert.equal(contract.contractKey,source.world.contracts[contract.playerKey]!.contractKey);
  assert.equal(contract.annualSalaryWon,source.world.contracts[contract.playerKey]!.annualSalaryWon);
  assert.deepEqual(contract.servicePay!.ledger.receipts,[]);
 }
 const bad=structuredClone(c.world),key=club.roster.find(k=>bad.contracts[k]!.annualSalaryWon<KBO_MONEY.maximumSalaryWon)!;
 assert.ok(key);bad.contracts[key]!.annualSalaryWon+=10_000;bad.clubs.find(t=>t.id===clubId)!.reservedSalaryWon+=10_000;
 assert.throws(()=>assertKboRecruitmentWorld(bad),/INVALID_KBO_FUTURE_COMMITMENT/);
});

test('future debt blocks optional one-year FA and rookie acquisitions even with available current cash',()=>{
 const {career:c,clubId}=fixture(),before=canonicalJson(c);
 const result=runKboAiFreeAgentMarket({world:c.world,pool:poolFor(c),sourceSeasonKey:String(Number(c.world.seasonKey)-1),records:c.records,health:c.health,difficulty:c.difficulty});
 assert.ok(result.rounds.every(r=>r.offers.every(o=>o.clubId!==clubId)));
 assert.ok(result.rounds.some(r=>r.offers.length>0));
 const world=structuredClone(c.world),draft=draftKboRookieClass(world,world.seasonKey,world.clubs.map(t=>t.id),c.difficulty);
 assert.ok(draft.picks.every(p=>p.clubId!==clubId));assert.ok(draft.picks.length>0);
 const player={...structuredClone(c.world.players[c.protagonistKey]!),simulationKey:'service-budget-rookie'};
 const draftWorld={...c.world,status:'CREATED' as const},program=prepareKboDraft(draftWorld,{assessmentKey:'service-budget-draft',player,baseScore:80,preferredClubId:clubId}),resolved=resolveKboDraft(draftWorld,program,program.version);
 assert.notEqual(resolved.result!.clubId,clubId);assert.equal(canonicalJson(c),before);
});

test('AI sends an expired optional renewal to FA while faithfully retaining the original military debt',()=>{
 const {career:c,clubId}=fixture(),club=c.world.clubs.find(t=>t.id===clubId)!,overhang=kboFutureCommitmentWon(c.world,clubId,1)-club.budgetWon*.9;
 const key=club.roster.filter(k=>k!==c.protagonistKey).sort((a,b)=>c.world.contracts[a]!.annualSalaryWon-c.world.contracts[b]!.annualSalaryWon)[0]!;
 assert.ok(c.world.contracts[key]!.annualSalaryWon<overhang);
 c.world.contracts[key]!.years=1;
 const priorContracts=structuredClone(c.world.contracts);priorContracts[key]!.seasonKey=String(Number(c.world.seasonKey)-1);
 const before=canonicalJson(c),result=prepareKboAiRenewals({world:c.world,pool:poolFor(c),priorContracts,expiringKeys:[key],protagonistKey:c.protagonistKey,sourceSeasonKey:priorContracts[key]!.seasonKey,records:c.records,health:c.health});
 assert.ok(result.receipt.expired.some(e=>e.playerKey===key));assert.equal(result.receipt.renewed.length,0);
 assert.deepEqual(result.world.suspendedContracts,c.world.suspendedContracts);assert.equal(result.pool.players[key]!.previousContract!.contractKey,priorContracts[key]!.contractKey);
 assert.equal(canonicalJson(c),before);assertKboRecruitmentWorld(result.world);
});


test('annual renewal checks its target year, preserves fundable choice after a current rescue, and refuses new overcommitment',()=>{
 const {source:c}=fixture(),club=c.world.clubs.find(t=>t.id===c.protagonistClubId)!;
 // Controlled end-of-season metadata isolates the existing offer reducer, without inventing a played-season proof.
 c.phaseContext={phase:'SEASON_REVIEW'};c.seasonClose={receiptKey:'controlled-policy-close',seasonKey:c.world.seasonKey,sourceRevision:c.revision,agingLossUnits:0,trainingForfeited:true};
 c.days={schemaVersion:1,worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,days:[{day:300,evidence:'controlled-policy-close',result:{injured:[],recovered:[]}}]};
 c.world.contracts[c.protagonistKey]!.years=1;
 // This current-year ledger fixture isolates target-year admission; support generation has separate exact-deficit tests.
 c.schemaVersion=6;c.world.suspendedContracts={};
 c.world.finance={guarantees:[],grants:[{receiptKey:'controlled-current-service-rescue',seasonKey:c.world.seasonKey,clubId:club.id,amountWon:1,reason:'SERVICE_OBLIGATION_REBUILD'}]};
 assertKboRecruitmentWorld(c.world);assert.equal(kboRecruitmentOpen(c.world,club.id),false);
 const offered=offerKboRenewal(c,c.revision),event=offered.events.find(e=>e.eventKey===offered.renewal!.eventKey)!;
 assert.equal(acceptKboRenewal(offered,offered.revision,{eventKey:event.eventKey,eventVersion:event.version}).renewal!.status,'ACCEPTED');
 const blocked=structuredClone(c),target=blocked.world.clubs.find(t=>t.id===club.id)!;
 for(const key of target.roster)blocked.world.contracts[key]!.years=key===c.protagonistKey?1:2;
 let room=target.budgetWon*.9-kboFutureCommitmentWon(blocked.world,target.id,1);
 for(const key of target.roster){if(key===c.protagonistKey)continue;const contract=blocked.world.contracts[key]!,n=Math.min(KBO_MONEY.maximumSalaryWon-contract.annualSalaryWon,room);contract.annualSalaryWon+=n;target.reservedSalaryWon+=n;room-=n;}
 assert.equal(room,0);assert.equal(kboFutureCommitmentWon(blocked.world,target.id,1),target.budgetWon*.9);
 assert.equal(offerKboRenewal(blocked,blocked.revision).offseasonExit!.status,'OPEN');
 const changed=structuredClone(offered);changed.world=blocked.world;
 assert.throws(()=>acceptKboRenewal(changed,changed.revision,{eventKey:event.eventKey,eventVersion:event.version}),/INVALID_KBO_RENEWAL/);
});


test('transfer roster repair funds a resumed NPC promotion before changing first-team registration and skips an unfunded promotion',()=>{
 for(const funded of [true,false]){
  const c=remainderDecisionCareer(),club=c.world.clubs.find(t=>t.id===c.protagonistClubId)!,position=c.world.players[c.protagonistKey]!.position,day=c.days!.days.at(-1)!.day;
  assert.ok(club.firstTeam.includes(c.protagonistKey));
  const key=club.roster.find(k=>k!==c.protagonistKey && !club.firstTeam.includes(k) && c.world.players[k]!.position===position && !c.health.injuries[k])!;assert.ok(key);
  const player=c.world.players[key]!,contract=c.world.contracts[key]!,year=Number(c.world.seasonKey),june30=year%4===0 && (year%100!==0 || year%400===0)?181:180;
  // A real resumed payroll ledger and a controlled remaining Futures calendar isolate the registration cost difference.
  const program=enlistInSangmu({worldKey:c.world.worldKey,playerKey:key,clubId:club.id,selectionSeasonKey:String(year-2),contract,remainingPaidGameDays:144}),completed=completeSangmuBlock(completeSangmuBlock(program,String(year-1),300),String(year),june30),oldCharge=kboContractSeasonCharge(contract);
  contract.servicePay=createKboServicePayroll(contract,program,{seasonKey:c.world.seasonKey,worldDay:june30});contract.servicePay.ledger=resumeKboContractPayments(contract.servicePay.ledger,completed);
  const next=c.competitionSchedule!.leagues.FUTURES.find(g=>g.worldDay>day && [g.homeTeamKey,g.awayTeamKey].includes(club.id))!;assert.ok(next);
  c.competitionSchedule!.leagues.FUTURES=c.competitionSchedule!.leagues.FUTURES.filter(g=>g.worldDay<=day || ![g.homeTeamKey,g.awayTeamKey].includes(club.id) || g.simulationKey===next.simulationKey);
  contract.servicePay.reservedGameDays=1;club.reservedSalaryWon+=kboContractSeasonCharge(contract)-oldCharge;
  const values=Object.fromEntries(abilityKeys(player.kind).map(axis=>[axis,1_000_000]));player.abilities={...values};player.potential={...values};player.careerPeaks={...values};
  const expected=c.competitionSchedule!.leagues.KBO.filter(g=>g.worldDay>day && [g.homeTeamKey,g.awayTeamKey].includes(club.id)).length;assert.ok(expected>1);
  if(!funded){
   let room=kboClubBalance(c.world,club.id).availableWon;
   for(const k of club.roster){if(k===key || k===c.protagonistKey)continue;const current=c.world.contracts[k]!;current.years=1;const n=Math.min(KBO_MONEY.maximumSalaryWon-current.annualSalaryWon,Math.floor(room/10_000)*10_000);current.annualSalaryWon+=n;club.reservedSalaryWon+=n;room-=n;}
   assert.ok(room<10_000);
  }
  assertKboRecruitmentWorld(c.world);
  const offered=offerKboRemainderRenewal(c,c.revision),view=kboRemainderRenewalView(offered)!,compared=compareKboRemainderOffers(offered,offered.revision,{eventKey:view.eventKey,eventVersion:view.eventVersion}).career,comparison=kboRemainderRenewalView(compared)!;
  assert.ok(comparison.comparison!.offers.length);
  const before=canonicalJson(compared),result=acceptKboRemainderTransfer(compared,compared.revision,{eventKey:comparison.eventKey,eventVersion:comparison.eventVersion,offerKey:comparison.comparison!.offers[0]!.offerKey}),original=result.world.clubs.find(t=>t.id===club.id)!;
  assert.equal(original.firstTeam.includes(key),funded);assert.equal(result.world.contracts[key]!.servicePay!.reservedGameDays,funded?expected:1);
  assert.deepEqual(result.world.contracts[key]!.servicePay!.ledger,contract.servicePay.ledger);assert.equal(canonicalJson(compared),before);assertKboRecruitmentWorld(result.world);
 }
});
