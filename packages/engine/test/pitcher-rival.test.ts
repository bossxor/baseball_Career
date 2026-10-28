import test from 'node:test';
import assert from 'node:assert/strict';
import {createHighSchoolWorld} from '../src/high-school-world.js';
import {canonicalJson} from '../src/game.js';
import {emptyBatting,emptyPitching} from '../src/stats.js';
import type {GameContribution} from '../src/records.js';
import {formHighSchoolRelations,settleRelationshipDirectDuels} from '../src/relationships.js';
import {formPitcherRivalFromGame,unreadPitcherRivalNotices,resolvePitcherRivalNotice,validatePitcherRivalFormations} from '../src/pitcher-rival.js';

function fixture() {
 const world=createHighSchoolWorld({worldKey:'pitcher-rival',seasonKey:'2032',seed:'pitcher-rival-fixture',schoolId:'H01',startDay:31,player:{simulationKey:'me',name:'내타자',kind:'HITTER',position:'CF',throws:'R',bats:'R',pitchForm:null,archetype:'BALANCED',focus:['CONTACT','POWER','DISCIPLINE','DEFENSE'],difficulty:'GROWTH'}});
 const pitchers=Object.values(world.players).filter(p=>p.kind==='PITCHER').slice(0,2).map(p=>p.simulationKey),game=contribution('formation',32,pitchers[0]!);
 return {world,pitchers,revision:4,events:[],relationNotices:[],phaseContext:{phase:'SEASON_PROGRESS' as const},relationships:formHighSchoolRelations(world,31),records:{revision:1,games:{formation:game}}};
}
function contribution(gameKey:string,worldDay:number,pitcherKey:string,seasonKey='2032',PA=4,H=2):GameContribution {
 const s={PA,AB:PA,H,BB:0,HBP:0,K:PA-H,TB:H,HR:0,twoB:0,threeB:0,RBI:0},z={PA:0,AB:0,H:0,BB:0,HBP:0,K:0,TB:0,HR:0,twoB:0,threeB:0,RBI:0},pz={BF:0,outs:0,AB:0,H:0,TB:0,HR:0,BB:0,HBP:0,K:0};
 return {gameKey,worldDay,scope:{seasonKey,leagueKey:'HS',phase:'REGULAR'},teams:{},batting:{me:{...emptyBatting(),...s,games:1,fieldingGames:1,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0}},pitching:{[pitcherKey]:{...emptyPitching(),BF:PA,H,K:PA-H,outs:PA-H,games:1,starts:1,starterOuts:PA-H,loadedBF:0,W:0,L:0,SV:0,HLD:0,BS:0,shutouts:0}},batterSplits:{me:{L:{...z},R:{...s}}},pitcherSplits:{[pitcherKey]:{L:{...pz},R:{...pz,BF:PA,AB:PA,H,TB:H,K:PA-H,outs:PA-H}}},matchups:{[JSON.stringify(['me',pitcherKey])]:{batterKey:'me',pitcherKey,stats:s}}};
}

test('pitcher rival preserves same-kind relations, binds E94 and excludes its formation game from a duel',()=>{
 const source=fixture(),before=canonicalJson(source),formed=formPitcherRivalFromGame(source,'formation')!;
 assert.equal(canonicalJson(source),before);assert.deepEqual(formed.relationships.relations.slice(0,source.relationships.relations.length),source.relationships.relations);
 assert.equal(formed.relationships.relations.length,source.relationships.relations.length+1);
 const current={...source,...formed};validatePitcherRivalFormations(current);
 assert.equal(formed.relationships.pitcherRivalFormations!.length,1);assert.equal(formed.relationNotices.length,1);
 assert.equal(settleRelationshipDirectDuels(current,'formation')!.directDuels?.length??0,0);
 assert.equal(formPitcherRivalFromGame(JSON.parse(JSON.stringify(current)),'formation'),null);
 const rows=unreadPitcherRivalNotices(current);assert.equal(rows.length,1);
 assert.doesNotMatch(JSON.stringify(rows),/seed|recordRevision|formationKey|abilities|PA|TB/);
 const read=resolvePitcherRivalNotice(current,4,{eventKey:rows[0]!.eventKey,eventVersion:1,command:'OPEN_RELATIONS'});
 assert.equal(read.career.revision,5);assert.equal(read.navigation.targetScreen,'S42');assert.equal(unreadPitcherRivalNotices(read.career).length,0);
 assert.strictEqual(read.career.records,current.records);assert.strictEqual(read.career.world,current.world);assert.strictEqual(read.career.phaseContext,current.phaseContext);assert.strictEqual(read.career.relationships,current.relationships);
 assert.throws(()=>resolvePitcherRivalNotice(read.career,5,{eventKey:rows[0]!.eventKey,eventVersion:1,command:'OPEN_RELATIONS'}),/EVENT_VERSION_CHANGED|EVENT_ALREADY_RESOLVED/);
});

test('one slot is shared by all competitions in a world season; prior rivals persist into the next season',()=>{
 const source=fixture(),formed=formPitcherRivalFromGame(source,'formation')!,second=contribution('second',33,source.pitchers[1]!);second.scope.leagueKey='KBO';
 const next={...source,...formed,records:{revision:2,games:{...source.records.games,second}}};
 assert.equal(formPitcherRivalFromGame(next,'second'),null);
 const later=contribution('later',1,source.pitchers[1]!,'2033'),season={...next,world:{...next.world,seasonKey:'2033'},records:{revision:3,games:{...next.records.games,later}}};
 const added=formPitcherRivalFromGame(season,'later')!;assert.equal(added.relationships.pitcherRivalFormations!.length,2);
 assert.deepEqual(added.relationships.relations.slice(0,next.relationships.relations.length),next.relationships.relations);
 const rematch=contribution('rematch',2,source.pitchers[0]!,'2033'),duels=settleRelationshipDirectDuels({...season,...added,records:{revision:4,games:{...season.records.games,rematch}}},'rematch')!;
 assert.equal(duels.directDuels![0]!.gameKey,'rematch');
});

test('no actual decided regular matchup means no formation; actor and source tampering is rejected',()=>{
 const source=fixture(),post=structuredClone(source);post.records.games.formation.scope.phase='POSTSEASON';assert.equal(formPitcherRivalFromGame(post,'formation'),null);
 const none=structuredClone(source);none.records.games.formation.matchups={};
 assert.throws(()=>formPitcherRivalFromGame(none,'formation'),/BATTING_SPLIT_MISMATCH/);
 assert.throws(()=>formPitcherRivalFromGame({...source,protagonistKey:source.pitchers[0]!},'formation'),/INVALID_PITCHER_RIVAL_SOURCE/);
 assert.throws(()=>formPitcherRivalFromGame(source,'missing'),/UNKNOWN_PITCHER_RIVAL_GAME/);
 const undecided=structuredClone(source);undecided.records.games.formation=contribution('formation',32,source.pitchers[0]!,'2032',4,1);
 assert.equal(formPitcherRivalFromGame(undecided,'formation'),null);
 const formed=formPitcherRivalFromGame(source,'formation')!,forged=structuredClone({...source,...formed});
 forged.relationships.pitcherRivalFormations![0]!.recordRevision=2;
 assert.throws(()=>validatePitcherRivalFormations(forged),/INVALID_PITCHER_RIVAL_FORMATION/);
 const notice=structuredClone({...source,...formed});notice.relationNotices[0]!.evidence.fields={...notice.relationNotices[0]!.evidence.fields,creationReceiptId:'forged'};
 assert.throws(()=>unreadPitcherRivalNotices(notice),/INVALID_EVENT_INSTANCE|INVALID_PITCHER_RIVAL_NOTICE/);
});

test('simultaneous candidates use actual matchup PA then stable pitcher key, without RNG',()=>{
 for(const secondPA of [4,5]){
  const source=fixture(),g=source.records.games.formation,other=contribution('formation',32,source.pitchers[1]!,'2032',secondPA,0);
  for(const key of ['PA','AB','H','BB','HBP','K','TB','HR','twoB','threeB','RBI'] as const){g.batting.me![key]+=other.batting.me![key];g.batterSplits.me!.R[key]+=other.batterSplits.me!.R[key];}
  g.pitching={...g.pitching,...other.pitching};g.pitcherSplits={...g.pitcherSplits,...other.pitcherSplits};g.matchups={...other.matchups,...g.matchups};
  const formed=formPitcherRivalFromGame(source,'formation')!,receipt=formed.relationships.pitcherRivalFormations![0]!;
  assert.equal(receipt.otherPlayerKey,secondPA===5?source.pitchers[1]:[...source.pitchers].sort()[0]);
  if(secondPA===5)assert.equal(receipt.outcome,'LOSS');
  const reverse={...source,records:{...source.records,games:{formation:{...g,matchups:Object.fromEntries(Object.entries(g.matchups).reverse())}}}};
  assert.deepEqual(formPitcherRivalFromGame(reverse,'formation'),formed);
 }
});

test('top-level pro actor and registration are supported without school identity fields',()=>{
 const source=fixture(),{protagonistKey}=source.world,world={worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,players:source.world.players};
 const pro={...source,world,protagonistKey,registration:{clubId:'actual-club'}};
 const formed=formPitcherRivalFromGame(pro,'formation')!;
 assert.equal(formed.relationships.pitcherRivalFormations![0]!.primaryPlayerKey,protagonistKey);
 assert.equal(formed.relationNotices[0]!.resume.registrationKey,'actual-club');
 assert.equal(unreadPitcherRivalNotices({...pro,...formed}).length,1);
});


test('generic pitcher rival notice refuses sealed school roots before changing read metadata',()=>{
 const source=fixture(),formed=formPitcherRivalFromGame(source,'formation')!;
 for(const seal of ['kboYearEnd','collegeYearEnd','usYearEnd'] as const){
  const sealed={...source,...formed,[seal]:{sourceRevision:source.revision}},raw=canonicalJson(sealed),event=sealed.relationNotices[0]!;
  assert.throws(()=>resolvePitcherRivalNotice(sealed,sealed.revision,{eventKey:event.eventKey,eventVersion:event.version,command:'OPEN_RELATIONS'}),/PITCHER_RIVAL_ROOT_WRAPPER_REQUIRED/);assert.equal(canonicalJson(sealed),raw);
 }
});
