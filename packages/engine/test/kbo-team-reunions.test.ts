import test from 'node:test';
import assert from 'node:assert/strict';
import type {KboCareer} from '../src/kbo-career-entry.js';
import type {PlayerRelationship,RelationStage} from '../src/relationships.js';
import {remainderDecisionCareer} from './remainder-fixtures.js';
import {offerKboRemainderRenewal,compareKboRemainderOffers,kboRemainderRenewalView} from '../src/kbo-remainder-renewal.js';
import {acceptKboRemainderTransfer} from '../src/kbo-remainder-transfer.js';
import {settleKboTransferTeamReunions,kboTeamReunionNoticeRows} from '../src/kbo-team-reunions.js';
import {unreadKboRelationNotices,resolveKboRelationNotice,kboRelationshipListView} from '../src/kbo-relations.js';
import {canonicalJson} from '../src/game.js';
import {emptySangmuUnit} from '../src/kbo-sangmu-unit.js';
import {enlistInActiveService} from '../src/kbo-military-program.js';
import {createKboServicePayroll} from '../src/kbo-service-payroll.js';
import {settleKboOpponentReunions} from '../src/kbo-reunion-events.js';

function comparison(c:KboCareer){const o=offerKboRemainderRenewal(c,c.revision),v=kboRemainderRenewalView(o)!;return compareKboRemainderOffers(o,o.revision,{eventKey:v.eventKey,eventVersion:v.eventVersion}).career;}
function accept(c:KboCareer){const v=kboRemainderRenewalView(c)!;return acceptKboRemainderTransfer(c,c.revision,{eventKey:v.eventKey,eventVersion:v.eventVersion,offerKey:v.comparison!.offers[0]!.offerKey});}
function relation(c:KboCareer,key:string,stage:RelationStage='SEPARATED'):PlayerRelationship {
 const normalPairKey=JSON.stringify([c.protagonistKey,key].sort());return {relationKey:JSON.stringify(['RIVAL',normalPairKey]),normalPairKey,primaryPlayerKey:c.protagonistKey,otherPlayerKey:key,type:'RIVAL',stage,milestones:[{stage:'FORMED',evidenceKey:'controlled-formation:'+key,worldDay:0},{stage:'SEPARATED',evidenceKey:'controlled-separation:'+key,worldDay:1}]};
}
let cached:{base:KboCareer;other:string}|undefined;
function fixture(){if(!cached){const base=remainderDecisionCareer(),probe=comparison(base),to=base.world.clubs.find(t=>t.id===probe.remainderRenewal!.comparison!.offers[0]!.clubId)!,me=base.world.players[base.protagonistKey]!,other=to.roster.find(k=>base.world.players[k]!.kind===me.kind)!;cached={base,other};}return structuredClone(cached);}
function installed(){const {base,other}=fixture(),r=relation(base,other);base.relationships.relations=[...base.relationships.relations,r];return {c:comparison(base),r};}

test('actual transfer reunites an existing rival at registration while preserving records, RNG and old history',()=>{
 const {c,r}=installed(),before=canonicalJson(c),out=accept(c),actual=out.relationships.relations.find(x=>x.relationKey===r.relationKey)!,t=out.transferHistory!.at(-1)!;
 assert.equal(actual.stage,'REUNITED_TEAM');assert.equal(actual.type,'RIVAL');assert.deepEqual(actual.milestones.slice(0,-1),r.milestones);assert.deepEqual(t.sharedRelationKeys,[r.relationKey]);assert.equal(out.relationNotices.filter(e=>e.definitionId==='E96').length,1);
 assert.ok(out.relationships.relations.some(x=>x.type==='TEAMMATE'&&x.stage==='FORMED'&&out.world.clubs.find(t=>t.id===out.protagonistClubId)!.roster.includes(x.otherPlayerKey)));
 for(const field of ['records','health','days','development','seasonGrowth','traits'] as const)assert.equal(canonicalJson(out[field]),canonicalJson(c[field]));assert.deepEqual(out.world.rng,c.world.rng);assert.equal(canonicalJson(c),before);
 assert.deepEqual(accept(c),out);assert.deepEqual(accept(JSON.parse(JSON.stringify(c))),out);const snap=canonicalJson(out);settleKboTransferTeamReunions(c,out);assert.equal(canonicalJson(out),snap);assert.equal(kboRelationshipListView(out).find(x=>x.relationKey===r.relationKey)!.stage,'REUNITED_TEAM');
});

test('E94 and E96 coexist and acknowledgement changes only metadata without restoring the transfer phase',()=>{
 const {c}=installed(),out=accept(c),before=canonicalJson(out),rows=unreadKboRelationNotices(out),n=rows.find(x=>x.definitionId==='E96')!;assert.ok(n);assert.ok(rows.some(x=>x.definitionId==='E94'));
 const input={eventKey:n.eventKey,eventVersion:n.eventVersion,command:'OPEN_RELATIONS'},read=resolveKboRelationNotice(out,out.revision,input).career;
 assert.equal(read.revision,out.revision+1);for(const field of ['world','records','health','relationships','days','development','phaseContext'] as const)assert.equal(canonicalJson(read[field]),canonicalJson(out[field]));assert.deepEqual(read.relationNotices.filter(e=>e.definitionId==='E94'),out.relationNotices.filter(e=>e.definitionId==='E94'));assert.ok(!unreadKboRelationNotices(read).some(x=>x.eventKey===n.eventKey));
 assert.throws(()=>resolveKboRelationNotice(read,read.revision,input));assert.throws(()=>resolveKboRelationNotice(out,out.revision-1,input));assert.throws(()=>resolveKboRelationNotice(out,out.revision,{...input,eventVersion:n.eventVersion+1}));assert.throws(()=>resolveKboRelationNotice(out,out.revision,{...input,command:'ACK_EVENT'}));assert.equal(canonicalJson(out),before);
});

test('historical reunion proof survives later membership changes; missing, duplicated or forged proof rejects without mutation',()=>{
 const {c,r}=installed(),out=accept(c),later=structuredClone(out),club=later.world.clubs.find(t=>t.id===later.protagonistClubId)!;club.roster=club.roster.filter(k=>k!==r.otherPlayerKey);
 assert.equal(kboTeamReunionNoticeRows(later).length,1);
 for(const mutate of [(x:KboCareer)=>{delete x.transferHistory!.at(-1)!.sharedRelationKeys;},(x:KboCareer)=>{x.transferHistory!.at(-1)!.sharedRelationKeys=[r.relationKey,r.relationKey];},(x:KboCareer)=>{x.relationNotices.find(e=>e.definitionId==='E96')!.resume.registrationKey='foreign';},(x:KboCareer)=>{x.relationships.relations=x.relationships.relations.map(row=>row.relationKey===r.relationKey?{...row,milestones:row.milestones.filter(m=>m.stage!=='SEPARATED')}:row);}]){const x=structuredClone(out);mutate(x);const before=canonicalJson(x);assert.throws(()=>unreadKboRelationNotices(x));assert.equal(canonicalJson(x),before);}
});

test('old completed transfers are read without backfilling team reunions; failed registration leaves its source intact',()=>{
 const {base,other}=fixture(),out=accept(comparison(base)),old=structuredClone(out);delete old.transferHistory!.at(-1)!.sharedRelationKeys;old.relationships.relations=[...old.relationships.relations,relation(old,other)];const before=canonicalJson(old);
 assert.ok(!unreadKboRelationNotices(old).some(e=>e.definitionId==='E96'));assert.equal(kboRelationshipListView(old).find(r=>r.otherPlayerKey===other&&r.type==='RIVAL')!.stage,'SEPARATED');assert.equal(canonicalJson(old),before);
 const {c}=installed(),bad=structuredClone(c);bad.relationships.relations=[...bad.relationships.relations,{...relation(bad,'foreign'),primaryPlayerKey:'foreign'}];const snap=canonicalJson(bad);assert.throws(()=>accept(bad));assert.equal(canonicalJson(bad),snap);
});

test('team registration includes an injured player but excludes loans, active service and already formed or retired relations',()=>{
 const {c,r}=installed(),moved=accept(c);
 for(const state of ['INJURED','LOANED','ACTIVE','FORMED','RETIRED','REUNITED_OPPONENT'] as const){
  const x=structuredClone(moved),t=x.transferHistory!.at(-1)!;delete t.sharedRelationKeys;
  x.relationships.relations=x.relationships.relations.map(row=>row.relationKey===r.relationKey?{...structuredClone(r),stage:['FORMED','RETIRED','REUNITED_OPPONENT'].includes(state)?state as RelationStage:'SEPARATED'}:row);
  x.relationNotices=x.relationNotices.filter(e=>e.definitionId!=='E96');
  if(state==='INJURED')x.health.injuries[r.otherPlayerKey]={severity:'MILD',remainingTeamGames:1,diagnosedGameKey:'controlled-registered-injury',seasonKey:x.world.seasonKey};
  if(state==='LOANED')x.sangmu={...(x.sangmu??emptySangmuUnit()),loaned:[r.otherPlayerKey]};
  // Controlled adapter input: public enlistment behavior is covered by the existing military tests.
  if(state==='ACTIVE'){const contract=x.world.contracts[r.otherPlayerKey]!,year=Number(x.world.seasonKey),program=enlistInActiveService({worldKey:x.world.worldKey,playerKey:r.otherPlayerKey,clubId:x.protagonistClubId,selectionSeasonKey:String(year-2),contract,remainingPaidGameDays:1});contract.servicePay=createKboServicePayroll(contract,program,{seasonKey:x.world.seasonKey,worldDay:year%4===0&&(year%100!==0||year%400===0)?181:180});}
  settleKboTransferTeamReunions(c,x);
  assert.equal(x.relationNotices.filter(e=>e.definitionId==='E96').length,['INJURED','REUNITED_OPPONENT'].includes(state)?1:0);
 }
});

test('actual opposing game E95 survives the later confirmed transfer E96 and both notices remain independently readable',()=>{
 const {base}=fixture(),day=base.days!.days.at(-1)!.day,g=Object.values(base.records.games).find(g=>g.scope.seasonKey===base.world.seasonKey&&g.worldDay===day&&(Object.hasOwn(g.batting,base.protagonistKey)||Object.hasOwn(g.pitching,base.protagonistKey)))!;assert.ok(g);
 const rows=base.health.games.filter(h=>h.evidence.gameKey===g.gameKey).map(h=>h.evidence),mine=rows.find(h=>h.roster.includes(base.protagonistKey))!,opponent=rows.find(h=>h.teamKey!==mine.teamKey)!,other=opponent.appearances[0]!.playerKey,r=relation(base,other);
 base.relationships.relations=[...base.relationships.relations,r];settleKboOpponentReunions(base,day);base.revision++;
 assert.equal(base.relationships.relations.find(x=>x.relationKey===r.relationKey)!.stage,'REUNITED_OPPONENT');
 const c=comparison(base),v=kboRemainderRenewalView(c)!,clubId=opponent.teamKey.slice(opponent.teamKey.indexOf(':')+1),offer=v.comparison!.offers.find(x=>x.clubId===clubId)!;assert.ok(offer);
 const out=acceptKboRemainderTransfer(c,c.revision,{eventKey:v.eventKey,eventVersion:v.eventVersion,offerKey:offer.offerKey}),actual=out.relationships.relations.find(x=>x.relationKey===r.relationKey)!;
 assert.equal(actual.stage,'REUNITED_TEAM');assert.deepEqual(actual.milestones.slice(0,-1),base.relationships.relations.find(x=>x.relationKey===r.relationKey)!.milestones);assert.equal(canonicalJson(out.records),canonicalJson(base.records));
 let read=out;for(const definitionId of ['E95','E96']){const n=unreadKboRelationNotices(read).find(x=>x.definitionId===definitionId)!;assert.ok(n);read=resolveKboRelationNotice(read,read.revision,{eventKey:n.eventKey,eventVersion:n.eventVersion,command:'OPEN_RELATIONS'}).career;}
 assert.ok(!unreadKboRelationNotices(read).some(x=>['E95','E96'].includes(x.definitionId)));assert.deepEqual(read.relationships,out.relationships);
});
