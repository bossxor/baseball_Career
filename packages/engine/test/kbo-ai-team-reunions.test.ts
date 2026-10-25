import test from 'node:test';
import assert from 'node:assert/strict';
import type {KboCareer} from '../src/kbo-career-entry.js';
import type {PlayerRelationship} from '../src/relationships.js';
import {enteredKboCareer} from './fixtures.js';
import {nextKboFreeAgentYear} from '../src/kbo-free-agents.js';
import {confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {startKboRegularSeason,advanceKboCareer} from '../src/kbo-progress.js';
import {startKboPostseason,advanceKboPostseason} from '../src/kbo-postseason-progress.js';
import {settleKboSeasonGrowth} from '../src/kbo-season-growth.js';
import {closeKboSeason} from '../src/kbo-year-end.js';
import {startNextKboSeason} from '../src/kbo-year-transition.js';
import {offerKboRenewal,acceptKboRenewal} from '../src/kbo-renewal.js';
import {settleKboAiTeamReunions,kboTeamReunionNoticeRows} from '../src/kbo-team-reunions.js';
import {resolveKboRelationNotice,unreadKboRelationNotices} from '../src/kbo-relations.js';
import {assertKboRecruitmentWorld} from '../src/kbo-draft.js';
import {kboClubBalance,kboFutureCommitmentWon} from '../src/kbo-finance.js';
import {canonicalJson} from '../src/game.js';

function ready(c:KboCareer){const p=confirmKboPreseasonPlan(c,c.revision),o=confirmKboOpeningRoster(p,p.revision),s=confirmKboSeasonSchedule(o,o.revision);return startKboRegularSeason(s,s.revision);}
function closed(entry:KboCareer){
 let c=ready(entry);const fixtures=Object.values(c.competitionSchedule!.leagues).flat(),first=Math.min(...fixtures.map(g=>g.worldDay)),last=Math.max(...fixtures.map(g=>g.worldDay));
 // Unplayed regular dates are controlled; postseason, closure, Y02 and all AI signing decisions use native commands.
 c.days!.days=Array.from({length:last-first+1},(_,i)=>({day:first+i,evidence:'controlled-AI-source-clock',result:{injured:[],recovered:[]}}));c.phaseContext={phase:'SEASON_REVIEW'};
 c=startKboPostseason(c,c.revision);for(let i=0;i<400;i++){const out=advanceKboPostseason(c,c.revision);c=out.career;if(out.stopReason==='POSTSEASON_COMPLETE')break;}
 c=settleKboSeasonGrowth(c,c.revision).career;c=closeKboSeason(c,c.revision,true);const offer=offerKboRenewal(c,c.revision);return acceptKboRenewal(offer,offer.revision,{eventKey:offer.renewal!.eventKey,eventVersion:offer.events.find(e=>e.eventKey===offer.renewal!.eventKey)!.version});
}
function relation(c:KboCareer,key:string,type:PlayerRelationship['type']):PlayerRelationship {
 const normalPairKey=JSON.stringify([c.protagonistKey,key].sort());return {relationKey:JSON.stringify([type,normalPairKey]),normalPairKey,primaryPlayerKey:c.protagonistKey,otherPlayerKey:key,type,stage:'SEPARATED',milestones:[{stage:'FORMED',worldDay:0,evidenceKey:'controlled-before-AI-formation:'+key},{stage:'SEPARATED',worldDay:1,evidenceKey:'controlled-before-AI-separation:'+key}]};
}
function firstTeam(c:KboCareer,key:string,selected:boolean,excluded:readonly string[]){
 const club=c.world.clubs.find(t=>t.id===c.protagonistClubId)!;if(club.firstTeam.includes(key)===selected)return;
 const swap=club.roster.find(k=>k!==key && !excluded.includes(k) && club.firstTeam.includes(k)===selected && !c.health.injuries[k] && c.world.players[k]!.position===c.world.players[key]!.position)!;assert.ok(swap);
 club.firstTeam=selected?club.firstTeam.map(k=>k===swap?key:k):club.firstTeam.map(k=>k===key?swap:k);
 if(key===c.protagonistKey)c.registration={...c.registration,firstTeam:selected,competitionKey:selected?'KBO':'FUTURES'};
}
type Fixture={c:KboCareer;fa:PlayerRelationship;renewed:PlayerRelationship;roundReceiptKey:string;renewalReceiptKey:string;contractKey:string;renewedContractKey:string;gameKey:string;day:number};
let cached:Fixture|undefined;
function input():Fixture {
 if(!cached){
  const entry=enteredKboCareer();entry.freeAgents=nextKboFreeAgentYear({worldKey:entry.world.worldKey,seed:entry.world.seed,seasonKey:entry.world.seasonKey,difficulty:entry.difficulty,registeredKeys:Object.keys(entry.world.players)});
  const before=closed(entry),probe=startNextKboSeason(before,before.revision),clubId=probe.protagonistClubId,ownPosition=probe.world.players[probe.protagonistKey]!.position,offseason=probe.aiOffseasons!.at(-1)!;
  const wins=offseason.rounds.flatMap(round=>round.outcomes.filter(o=>o.offerKey!==null).map(outcome=>({round,outcome,offer:round.offers.find(o=>o.offerKey===outcome.offerKey)!})));
  const winner=wins.find(x=>x.offer.clubId===clubId && before.freeAgents!.players[x.outcome.playerKey] && probe.world.players[x.outcome.playerKey]!.position!==ownPosition)!;assert.ok(winner);
  const renewal=offseason.renewal.renewed.find(r=>r.clubId===clubId && probe.world.players[r.playerKey]!.kind==='HITTER' && ![ownPosition,probe.world.players[winner.outcome.playerKey]!.position,'DH'].includes(probe.world.players[r.playerKey]!.position))!;assert.ok(renewal);
  const fa=relation(before,winner.outcome.playerKey,'RIVAL'),renewed=relation(before,renewal.playerKey,'TEAMMATE');
  // These prior relationships precede the real deterministic AI replay; offers and accepted contracts are not fabricated.
  before.relationships.relations=[...before.relationships.relations.filter(r=>![fa.relationKey,renewed.relationKey].includes(r.relationKey)),fa,renewed];const snapshot=canonicalJson(before),next=startNextKboSeason(before,before.revision);assert.equal(canonicalJson(before),snapshot);assert.deepEqual(next.aiOffseasons,probe.aiOffseasons);assert.equal(next.world.contracts[fa.otherPlayerKey]!.contractKey,winner.offer.offerKey);
  const c=ready(next),keys=[c.protagonistKey,fa.otherPlayerKey,renewed.otherPlayerKey];for(const key of keys)firstTeam(c,key,false,keys);c.registration={...c.registration,firstTeam:false,competitionKey:'FUTURES'};assert.doesNotThrow(()=>assertKboRecruitmentWorld(c.world));
  const game=c.competitionSchedule!.leagues.FUTURES.find(g=>[g.homeTeamKey,g.awayTeamKey].includes(clubId))!;assert.ok(game);c.competitionSchedule!.leagues={KBO:[],FUTURES:[game]};c.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:game.worldDay,pendingGame:null};
  cached={c,fa,renewed,roundReceiptKey:winner.round.receiptKey,renewalReceiptKey:offseason.renewal.receiptKey,contractKey:winner.offer.offerKey,renewedContractKey:c.world.contracts[renewed.otherPlayerKey]!.contractKey,gameKey:game.simulationKey,day:game.worldDay};
 }
 return structuredClone(cached);
}
function finishDay(source:KboCareer){let c=source;for(let i=0;i<150;i++){const out=advanceKboCareer(JSON.parse(JSON.stringify(c)),c.revision);c=out.career;assert.notEqual(out.stopReason,'ENGINE_LIMIT');if(out.daysClosed)return c;}throw Error('DAY_LIMIT');}
let playedCache:KboCareer|undefined;
function played(){playedCache??=finishDay(input().c);return structuredClone(playedCache);}
const notice=(c:KboCareer,r:PlayerRelationship)=>kboTeamReunionNoticeRows(c).find(n=>n.relationKey===r.relationKey);

test('real Y02 AI FA signing and renewal reunite both prior relationship kinds only at actual shared civilian registration',()=>{
 const f=input(),before=canonicalJson(f.c),a=finishDay(f.c),b=finishDay(JSON.parse(before));assert.deepEqual(a,b);assert.equal(canonicalJson(f.c),before);assert.ok(!a.sangmu);assert.ok(!a.transferHistory);
 const health=a.health.games.find(h=>h.evidence.gameKey===f.gameKey && h.evidence.teamKey==='FUTURES:'+a.protagonistClubId)!;assert.ok(health);
 for(const prior of [f.fa,f.renewed]){const actual=a.relationships.relations.find(r=>r.relationKey===prior.relationKey)!;assert.equal(actual.stage,'REUNITED_TEAM');assert.equal(actual.type,prior.type);assert.deepEqual(actual.milestones.slice(0,-1),prior.milestones);assert.ok(health.evidence.roster.includes(prior.primaryPlayerKey));assert.ok(health.evidence.roster.includes(prior.otherPlayerKey));assert.ok(notice(a,prior));}
 for(const [r,receipt,contract] of [[f.fa,f.roundReceiptKey,f.contractKey],[f.renewed,f.renewalReceiptKey,f.renewedContractKey]] as const){const event=a.relationNotices.find(e=>e.eventKey===notice(a,r)!.eventKey)!,id=JSON.parse(event.evidence.fields.sharedTeamRegistrationReceiptId as string);assert.deepEqual(id,['kbo-ai-shared-registration',r.relationKey,receipt,contract,f.gameKey,[...health.evidence.roster].sort()]);}
 const control=structuredClone(f.c);control.relationships.relations=[];const without=finishDay(control);for(const field of ['world','records','health','days','development','seasonGrowth','traits','aiOffseasons'] as const)assert.deepEqual(a[field],without[field]);
});

test('an injured AI signing on the actual shared bench qualifies without a plate appearance or pitched out',()=>{
 const f=input(),key=f.fa.otherPlayerKey;f.c.health.games=[...f.c.health.games,{evidence:{gameKey:'controlled-pre-AI-game-injury',teamKey:'FUTURES:'+f.c.protagonistClubId,seasonKey:f.c.world.seasonKey,day:0,roster:[key],appearances:[{playerKey:key,riskFatigue:81}]},result:{injured:[key],recovered:[]}}];f.c.health.injuries[key]={severity:'MILD',remainingTeamGames:1,diagnosedGameKey:'controlled-pre-AI-game-injury',seasonKey:f.c.world.seasonKey};
 const out=finishDay(f.c),g=out.records.games[f.gameKey]!;assert.ok(!g.batting[key]);assert.ok(!g.pitching[key]);assert.ok(notice(out,f.fa));
});

test('unaccepted FA offers, absent AI receipts and different actual competitions never fabricate a shared-team notice',()=>{
 const absent=input();delete absent.c.aiOffseasons;assert.ok(!notice(finishDay(absent.c),absent.fa));assert.ok(!notice(finishDay(absent.c),absent.renewed));
 const rejected=input();for(const round of rejected.c.aiOffseasons!.at(-1)!.rounds)for(const outcome of round.outcomes)if(outcome.playerKey===rejected.fa.otherPlayerKey)outcome.offerKey=null;assert.ok(!notice(finishDay(rejected.c),rejected.fa));
 const different=input();firstTeam(different.c,different.fa.otherPlayerKey,true,[different.c.protagonistKey,different.renewed.otherPlayerKey]);assert.ok(!notice(finishDay(different.c),different.fa));
});

test('historical AI notices reject missing, duplicated, released or forged acceptance and damaged shared health proof',()=>{
 const f=input(),a=played(),eventKey=notice(a,f.fa)!.eventKey;
 for(const mutate of [(c:KboCareer)=>{delete c.aiOffseasons;},(c:KboCareer)=>{c.aiOffseasons=[...c.aiOffseasons!,structuredClone(c.aiOffseasons!.at(-1)!)];},(c:KboCareer)=>{const round=c.aiOffseasons!.at(-1)!.rounds.find(r=>r.receiptKey===f.roundReceiptKey)!;round.releasedOfferKeys=[...round.releasedOfferKeys,f.contractKey];},(c:KboCareer)=>{c.aiOffseasons!.at(-1)!.rounds.find(r=>r.receiptKey===f.roundReceiptKey)!.offers.find(o=>o.offerKey===f.contractKey)!.clubId='foreign';},(c:KboCareer)=>{c.aiOffseasons!.at(-1)!.renewal.renewed=c.aiOffseasons!.at(-1)!.renewal.renewed.filter(r=>r.playerKey!==f.renewed.otherPlayerKey);},(c:KboCareer)=>{c.health.games=c.health.games.filter(h=>!(h.evidence.gameKey===f.gameKey && h.evidence.teamKey==='FUTURES:'+c.protagonistClubId));},(c:KboCareer)=>{const row=c.health.games.find(h=>h.evidence.gameKey===f.gameKey && h.evidence.teamKey==='FUTURES:'+c.protagonistClubId)!;c.health.games=[...c.health.games,structuredClone(row)];},(c:KboCareer)=>{c.health.games.find(h=>h.evidence.gameKey===f.gameKey && h.evidence.teamKey==='FUTURES:'+c.protagonistClubId)!.evidence.roster=[...c.health.games.find(h=>h.evidence.gameKey===f.gameKey && h.evidence.teamKey==='FUTURES:'+c.protagonistClubId)!.evidence.roster,'forged-registered-player'];},(c:KboCareer)=>{c.relationNotices.find(e=>e.eventKey===eventKey)!.resume.registrationKey='foreign';}]){
  const corrupt=structuredClone(a);mutate(corrupt);const before=canonicalJson(corrupt);assert.throws(()=>kboTeamReunionNoticeRows(corrupt));assert.equal(canonicalJson(corrupt),before);
 }
});

test('historical AI notices read and acknowledge after the signing changes club and contract; ACK changes metadata only',()=>{
 const f=input(),a=played(),from=a.world.clubs.find(c=>c.id===a.protagonistClubId)!,contract=a.world.contracts[f.fa.otherPlayerKey]!;
 // Later membership is a controlled balanced bench swap; every club keeps its roster count and all salary costs.
 const swap=a.world.clubs.filter(c=>c.id!==from.id).flatMap(to=>to.roster.filter(key=>!to.firstTeam.includes(key) && a.world.players[key]!.position===a.world.players[f.fa.otherPlayerKey]!.position).map(key=>({to,key,other:a.world.contracts[key]!}))).find(({to,other})=>{
  const delta=contract.annualSalaryWon-other.annualSalaryWon;return delta<=kboClubBalance(a.world,to.id).availableWon && -delta<=kboClubBalance(a.world,from.id).availableWon && [1,2,3].every(y=>{const future=(contract.years>y?contract.annualSalaryWon:0)-(other.years>y?other.annualSalaryWon:0);return kboFutureCommitmentWon(a.world,to.id,y)+future<=to.budgetWon*.9 && kboFutureCommitmentWon(a.world,from.id,y)-future<=from.budgetWon*.9;});
 });assert.ok(swap);
 const {to,key,other}=swap,delta=contract.annualSalaryWon-other.annualSalaryWon;from.roster=from.roster.map(k=>k===f.fa.otherPlayerKey?key:k).sort();to.roster=to.roster.map(k=>k===key?f.fa.otherPlayerKey:k).sort();from.reservedSalaryWon-=delta;to.reservedSalaryWon+=delta;other.clubId=from.id;contract.clubId=to.id;contract.contractKey='controlled-later-AI-contract';assert.doesNotThrow(()=>assertKboRecruitmentWorld(a.world));
 const before=canonicalJson(a),n=unreadKboRelationNotices(a).find(n=>n.eventKey===notice(a,f.fa)!.eventKey)!;assert.ok(n);const ack={eventKey:n.eventKey,eventVersion:n.eventVersion,command:'OPEN_RELATIONS'},read=resolveKboRelationNotice(a,a.revision,ack).career;
 for(const field of ['world','records','health','days','phaseContext','relationships','seasonGrowth','development','aiOffseasons'] as const)assert.equal(canonicalJson(read[field]),canonicalJson(a[field]));assert.equal(read.revision,a.revision+1);assert.ok(!unreadKboRelationNotices(read).some(e=>e.eventKey===n.eventKey));assert.equal(canonicalJson(a),before);assert.throws(()=>resolveKboRelationNotice(read,read.revision,ack));assert.throws(()=>resolveKboRelationNotice(a,a.revision-1,ack));
});

test('closed-day replay is idempotent and an old save without an AI receipt remains unchanged on reads',()=>{
 const f=input(),a=played(),before=canonicalJson(a);settleKboAiTeamReunions(a,f.day);assert.equal(canonicalJson(a),before);
 const unclosed=canonicalJson(f.c);assert.throws(()=>settleKboAiTeamReunions(f.c,f.day));assert.equal(canonicalJson(f.c),unclosed);
 const old=input().c;delete old.aiOffseasons;const snapshot=canonicalJson(old);assert.ok(!unreadKboRelationNotices(old).some(n=>n.definitionId==='E96'));assert.equal(canonicalJson(old),snapshot);
});
