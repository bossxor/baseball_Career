import test from 'node:test';
import assert from 'node:assert/strict';
import {stagedKboOffseason} from './kbo-offseason-fixtures.js';
import {canonicalJson} from '../src/game.js';
import {sealNationalCompetitionResult,confirmAthleteService,advanceAthleteDutySeason,nationalAthleteEligible,openNationalCallup,respondNationalCallup} from '../src/kbo-national.js';
import type {KboCareer} from '../src/kbo-career-entry.js';

function base():KboCareer {
 const s=stagedKboOffseason(0);
 return {schemaVersion:6,revision:1,difficulty:'GROWTH',world:s.world,protagonistKey:s.protagonistKey,protagonistClubId:s.world.clubs[0]!.id,phaseContext:{phase:'SEASON_REVIEW'},activation:{receiptKey:'a',sourceYearEndReceiptKey:'y',sourceRevision:0,contractKey:'c'},registration:{playerKey:s.protagonistKey,clubId:s.world.clubs[0]!.id,seasonKey:s.world.seasonKey,status:'ACTIVE',firstTeam:true},rights:{sourceType:'DRAFT',holderOrgId:s.world.clubs[0]!.id,territory:'KR'},amateurHistory:{revision:0},records:s.records,health:s.health,seasonGrowth:{seasonKey:s.world.seasonKey,days:0,finalized:true},development:{seasonStartPlayer:s.world.players[s.protagonistKey]!},relationships:{},events:[],relationNotices:[],styleUsedWindows:[],planHistory:[],military:{status:'UNRESOLVED',applications:[]},seasonClose:{seasonKey:s.world.seasonKey}} as unknown as KboCareer;
}

test('national callup accept and decline keep revision atomic',()=>{
 const c=base(),invited=openNationalCallup(c,c.revision,'AG');assert.equal(invited.national!.invitations[0]!.status,'INVITED');assert.equal(invited.national!.invitations[0]!.militaryEffect,true);
 const id=invited.national!.invitations[0]!.selectionId,accepted=respondNationalCallup(invited,invited.revision,id,'ACCEPT');assert.equal(accepted.national!.invitations[0]!.status,'ACCEPTED');
 assert.throws(()=>respondNationalCallup(accepted,accepted.revision,id,'DECLINE'),/NOT_OPEN/);
 const wbc=openNationalCallup(c,c.revision,'WBC');assert.equal(wbc.national!.invitations[0]!.militaryEffect,false);
 assert.equal(respondNationalCallup(wbc,wbc.revision,wbc.national!.invitations[0]!.selectionId,'DECLINE').national!.invitations[0]!.status,'DECLINED');
});

test('INT13 AG silver or WBC gold does not change military status',()=>{
 const c=base(),raw=canonicalJson(c.military);
 const silver=sealNationalCompetitionResult(c,c.revision,{competitionId:'ag-silver',tournament:'AG',seasonKey:c.world.seasonKey,medal:'SILVER',finalRank:2,officialAppearance:true,registered:true,resultVersion:1});
 assert.equal(silver.military!.status,'UNRESOLVED');assert.equal(silver.national!.benefits.length,0);
 const wbc=sealNationalCompetitionResult(c,c.revision,{competitionId:'wbc-gold',tournament:'WBC',seasonKey:c.world.seasonKey,medal:'GOLD',finalRank:1,officialAppearance:true,registered:true,resultVersion:1});
 assert.equal(wbc.military!.status,'UNRESOLVED');assert.equal(canonicalJson(c.military),raw);
 assert.equal(nationalAthleteEligible({competitionId:'x',tournament:'AG',seasonKey:c.world.seasonKey,medal:'GOLD',finalRank:1,officialAppearance:false,registered:true,resultVersion:1},'UNRESOLVED'),false);
});

test('INT14 OLY bronze with appearance becomes ATHLETE_ELIGIBLE once; INT15 completed stays put',()=>{
 const c=base();
 const elig=sealNationalCompetitionResult(c,c.revision,{competitionId:'oly-bronze',tournament:'OLY',seasonKey:c.world.seasonKey,medal:'BRONZE',finalRank:3,officialAppearance:true,registered:true,resultVersion:1});
 assert.equal(elig.military!.status,'ATHLETE_ELIGIBLE');assert.equal(elig.national!.benefits.length,1);
 assert.throws(()=>sealNationalCompetitionResult(elig,elig.revision,{competitionId:'oly-bronze',tournament:'OLY',seasonKey:c.world.seasonKey,medal:'BRONZE',finalRank:3,officialAppearance:true,registered:true,resultVersion:1}),/ALREADY_SEALED/);
 const duty=confirmAthleteService(elig,elig.revision);assert.equal(duty.military!.status,'ATHLETE_SERVICE');assert.equal(duty.national!.athleteDutySeasonsRemaining,3);
 const mid=structuredClone(duty);advanceAthleteDutySeason(mid);assert.equal(mid.national!.athleteDutySeasonsRemaining,2);assert.equal(mid.military!.status,'ATHLETE_SERVICE');
 advanceAthleteDutySeason(mid);advanceAthleteDutySeason(mid);assert.equal(mid.military!.status,'COMPLETED');assert.equal(mid.national!.athleteDutySeasonsRemaining,0);
 const done=base();done.military={status:'COMPLETED',applications:[]};
 const honor=sealNationalCompetitionResult(done,done.revision,{competitionId:'ag-gold-done',tournament:'AG',seasonKey:done.world.seasonKey,medal:'GOLD',finalRank:1,officialAppearance:true,registered:true,resultVersion:1});
 assert.equal(honor.military!.status,'COMPLETED');assert.equal(honor.national!.benefits.length,0);
});
