import {createWorldEvent,eventDefinition} from '../src/events.js';
import {advanceKboCareer} from '../src/kbo-progress.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {stagedKboOffseason} from './kbo-offseason-fixtures.js';
import {canonicalJson} from '../src/game.js';
import {sealNationalCompetitionResult,confirmAthleteService,advanceAthleteDutySeason,nationalAthleteEligible,openNationalCallup,respondNationalCallup,resolveKboNationalEvent,confirmNationalEligibility} from '../src/kbo-national.js';
import {playAsianGamesTournament,asianGamesNationPreset,rankNationalGroup} from '../src/national-tournament.js';
import type {KboCareer} from '../src/kbo-career-entry.js';
import {recordTotals} from '../src/records.js';
import {createSeasonCalendar} from '../src/season-calendar.js';
import {HITTER_ABILITIES} from '@playball/rules';

function base():KboCareer {
 const s=stagedKboOffseason(0);s.world.seasonKey='2030';s.world.calendar=createSeasonCalendar(2030);
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
 const reviewed=confirmNationalEligibility(elig,elig.revision,'oly-bronze');const back=event(reviewed,'E48'),returned=resolveKboNationalEvent(reviewed,reviewed.revision,{eventKey:back.eventKey,eventVersion:back.version,command:'CONFIRM_NATIONAL_RETURN'}).career;const duty=confirmAthleteService(returned,returned.revision);assert.equal(duty.military!.status,'ATHLETE_SERVICE');assert.equal(duty.national!.athleteDutySeasonsRemaining,3);
 const mid=structuredClone(duty);advanceAthleteDutySeason(mid,'2030');assert.equal(mid.national!.athleteDutySeasonsRemaining,3);
 for(const y of ['2031','2032','2033']){mid.world.seasonKey=y;mid.seasonClose={...mid.seasonClose!,seasonKey:y};advanceAthleteDutySeason(mid,y);const left:number|undefined=mid.national!.athleteDutySeasonsRemaining;advanceAthleteDutySeason(mid,y);assert.equal(mid.national!.athleteDutySeasonsRemaining,left);}
 assert.equal(mid.military!.status,'COMPLETED');assert.equal(mid.national!.athleteDutySeasonsRemaining,0);assert.equal(mid.military!.completedSeasonKey,'2033');
 const done=base();done.military={status:'COMPLETED',applications:[]};
 const honor=sealNationalCompetitionResult(done,done.revision,{competitionId:'ag-gold-done',tournament:'AG',seasonKey:done.world.seasonKey,medal:'GOLD',finalRank:1,officialAppearance:true,registered:true,resultVersion:1});
 assert.equal(honor.military!.status,'COMPLETED');assert.equal(honor.national!.benefits.length,0);
});

test('AG tournament plays real INTERNATIONAL games and can grant ATHLETE_ELIGIBLE on gold+appearance',()=>{
 assert.equal(asianGamesNationPreset().length,8);assert.ok(asianGamesNationPreset().some(n=>n.id==='HKG'&&n.strength===55));assert.ok(!asianGamesNationPreset().some(n=>n.id==='AUS'));
 const c=base();const p=c.world.players[c.protagonistKey]!;p.kind='HITTER';p.position='CF';p.bats='R';p.abilities=Object.fromEntries(HITTER_ABILITIES.map(a=>[a,650_000]));
 const invited=openNationalCallup(c,c.revision,'AG'),accepted=respondNationalCallup(invited,invited.revision,invited.national!.invitations[0]!.selectionId,'ACCEPT');
 assert.throws(()=>playAsianGamesTournament(c,c.revision),/CALLUP_REQUIRED/);
 const done=playAsianGamesTournament(accepted,accepted.revision);
 assert.equal(done.national!.competitions[0]!.gameKeys!.length,16);assert.equal(Object.values(done.records.games).filter(g=>g.scope.phase==='INTERNATIONAL').length,16);assert.ok(recordTotals(done.records,{seasonKey:done.world.seasonKey,leagueKey:'AG',phase:'INTERNATIONAL'}).batting[c.protagonistKey]!.PA>0);assert.equal(Object.keys(recordTotals(done.records,{seasonKey:done.world.seasonKey,leagueKey:'KBO',phase:'REGULAR'}).batting).length,0);assert.ok(done.events.some(e=>e.definitionId==='E46'));
 assert.equal(done.national!.competitions[0]!.tournament,'AG');assert.ok(done.national!.competitions[0]!.finalRank>=1);
 if(done.national!.competitions[0]!.medal==='GOLD'&&done.national!.competitions[0]!.officialAppearance)assert.equal(done.military!.status,'ATHLETE_ELIGIBLE');
 assert.throws(()=>playAsianGamesTournament(done,done.revision),/ALREADY_PLAYED|ALREADY_SEALED/);
});
function event(c:KboCareer,id:string){return c.events.find(e=>e.definitionId===id&&e.status==='OPEN')!;}
test('E44 domain response, E47 navigation/review and E48 return preserve benefit and original club',()=>{
 const c=base(),raw=canonicalJson(c),invited=openNationalCallup(c,c.revision,'AG'),e=event(invited,'E44');
 assert.equal(canonicalJson(c),raw);assert.throws(()=>advanceKboCareer(invited,invited.revision),/NATIONAL_DECISION_REQUIRED/);assert.throws(()=>resolveKboNationalEvent(invited,invited.revision,{eventKey:e.eventKey,eventVersion:e.version+1,command:'ACCEPT_NATIONAL'}),/VERSION/);
 const accepted=resolveKboNationalEvent(invited,invited.revision,{eventKey:e.eventKey,eventVersion:e.version,command:'ACCEPT_NATIONAL'}).career;assert.equal(accepted.events.find(x=>x.eventKey===e.eventKey)!.status,'RESOLVED');
 const gold=sealNationalCompetitionResult(accepted,accepted.revision,{competitionId:'controlled-gold',tournament:'AG',seasonKey:c.world.seasonKey,medal:'GOLD',finalRank:1,officialAppearance:true,registered:true,resultVersion:1}),benefits=canonicalJson(gold.national!.benefits),medal=event(gold,'E47'),back=event(gold,'E48');
 const nav=resolveKboNationalEvent(gold,gold.revision,{eventKey:medal.eventKey,eventVersion:medal.version,command:'OPEN_SERVICE_ELIGIBILITY'});assert.equal(nav.navigation!.targetScreen,'S26');assert.equal(nav.career,gold);assert.equal(event(gold,'E47').status,'OPEN');
 assert.throws(()=>confirmAthleteService(gold,gold.revision),/REVIEW_REQUIRED/);assert.throws(()=>resolveKboNationalEvent(gold,gold.revision,{eventKey:back.eventKey,eventVersion:back.version,command:'CONFIRM_NATIONAL_RETURN'}),/RETURN_NOT_READY/);
 const reviewed=confirmNationalEligibility(gold,gold.revision,'controlled-gold'),returned=resolveKboNationalEvent(reviewed,reviewed.revision,{eventKey:back.eventKey,eventVersion:back.version,command:'CONFIRM_NATIONAL_RETURN'}).career;
 assert.deepEqual(returned.national!.returnedCompetitions,['controlled-gold']);assert.equal(canonicalJson(returned.national!.benefits),benefits);assert.deepEqual(returned.world,gold.world);assert.deepEqual(returned.health,gold.health);
 assert.throws(()=>confirmNationalEligibility(returned,returned.revision,'controlled-gold'),/NOT_OPEN/);assert.throws(()=>resolveKboNationalEvent(returned,returned.revision,{eventKey:back.eventKey,eventVersion:back.version+1,command:'CONFIRM_NATIONAL_RETURN'}),/ALREADY_RESOLVED/);
 const duty=confirmAthleteService(returned,returned.revision),notice=event(duty,'E55'),ack=resolveKboNationalEvent(duty,duty.revision,{eventKey:notice.eventKey,eventVersion:notice.version,command:'ACK_SERVICE_OBLIGATION'}).career;
 assert.equal(ack.national!.athleteDutySeasonsRemaining,3);assert.equal(ack.military!.status,'ATHLETE_SERVICE');
 const skipped=structuredClone(ack);skipped.world.seasonKey='2032';skipped.seasonClose={...skipped.seasonClose!,seasonKey:'2032'};assert.throws(()=>advanceAthleteDutySeason(skipped,'2032'),/SEASON_GAP/);
});
test('national boundaries reject forged decisions, inconsistent medals, duplicate invitations and changed game evidence',()=>{
 const c=base(),invited=openNationalCallup(c,c.revision,'AG'),id=invited.national!.invitations[0]!.selectionId,raw=canonicalJson(invited);
 assert.throws(()=>respondNationalCallup(invited,invited.revision,id,'BAD' as 'ACCEPT'),/INVALID_NATIONAL_DECISION/);assert.equal(canonicalJson(invited),raw);
 const no=respondNationalCallup(invited,invited.revision,id,'DECLINE');assert.throws(()=>openNationalCallup(no,no.revision,'AG'),/CALLUP_OPEN/);
 assert.throws(()=>sealNationalCompetitionResult(c,c.revision,{competitionId:'fake',tournament:'AG',seasonKey:c.world.seasonKey,medal:'GOLD',finalRank:8,officialAppearance:true,registered:true,resultVersion:1}),/INVALID_NATIONAL_RESULT/);
 assert.throws(()=>sealNationalCompetitionResult(c,c.revision,{competitionId:'fake-row',tournament:'AG',seasonKey:c.world.seasonKey,medal:'GOLD',finalRank:1,officialAppearance:true,registered:true,resultVersion:1,gameKeys:['missing-game']}),/GAME_EVIDENCE/);
 const broken=structuredClone(invited);broken.national!.invitations=[...broken.national!.invitations,...broken.national!.invitations];assert.throws(()=>respondNationalCallup(broken,broken.revision,id,'ACCEPT'),/INVALID_NATIONAL_INVITATION/);
});
test('a pitcher protagonist has real international BF and persisted contributions with deterministic JSON replay',()=>{
 const c=base(),club=c.world.clubs[0]!,key=club.roster.find(k=>c.world.players[k]!.kind==='PITCHER'&&c.world.players[k]!.position==='SP')!;c.protagonistKey=key;const raw=canonicalJson(c),invited=openNationalCallup(c,c.revision,'AG'),accepted=respondNationalCallup(invited,invited.revision,invited.national!.invitations[0]!.selectionId,'ACCEPT');
 const done=playAsianGamesTournament(accepted,accepted.revision),t=recordTotals(done.records,{seasonKey:c.world.seasonKey,leagueKey:'AG',phase:'INTERNATIONAL'});assert.ok(t.pitching[key]!.BF>0);assert.equal(done.national!.competitions[0]!.officialAppearance,true);assert.equal(canonicalJson(c),raw);
 assert.deepEqual(playAsianGamesTournament(JSON.parse(JSON.stringify(accepted)),accepted.revision),done);
 const days=Object.values(done.records.games).filter(g=>(g.pitching[key]?.BF??0)>0).map(g=>g.worldDay).sort((a,b)=>a-b);for(let i=1;i<days.length;i++)assert.ok(days[i]!-days[i-1]!>=3);
});

test('international cyclic ties use head-to-head differential and seeded lots, with malformed groups rejected',()=>{
 const row=(a:string,b:string,R:number,RA:number)=>({a,b,winner:R>RA?a:b,contribution:{teams:{[a]:{games:1,W:R>RA?1:0,L:R>RA?0:1,T:0,R,RA},[b]:{games:1,W:R>RA?0:1,L:R>RA?1:0,T:0,R:RA,RA:R}}}});
 const rows=[row('A','B',4,0),row('B','C',2,0),row('C','A',1,0)];assert.deepEqual(rankNationalGroup(['A','B','C'],rows,'fixed'),['A','C','B']);
 const equal=[row('A','B',1,0),row('B','C',1,0),row('C','A',1,0)],a=rankNationalGroup(['A','B','C'],equal,'fixed');assert.deepEqual(rankNationalGroup(['C','A','B'],equal,'fixed'),a);assert.equal(new Set(a).size,3);assert.throws(()=>rankNationalGroup(['A','B','C'],[rows[0]!,rows[0]!,rows[1]!],'fixed'),/INVALID_NATIONAL_GROUP/);
});

test('athlete admission cancels competing pending Sangmu application without enlisting or charging salary',()=>{
 const c=base(),d=eventDefinition('E50'),pending=createWorldEvent({definitionId:'E50',worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,evidence:{version:1,type:d.evidenceDomain,fields:{playerSimulationKey:c.protagonistKey,serviceTaskIdOrServicePeriodId:'controlled-application',stage:'RESULT'}},resume:{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,phase:'SEASON_REVIEW',competitionKey:null,registrationKey:c.protagonistClubId,sourceRevision:c.revision},sourceSequence:1,worldDay:0});
 c.events=[pending];c.military={status:'APPLICATION_PENDING',applications:[{applicationId:'controlled-application',eventKey:pending.eventKey,selectionSeasonKey:c.world.seasonKey,score:80,accepted:true,slotKind:'HITTER',decision:'PENDING'}]};const raw=canonicalJson(c);
 const gold=sealNationalCompetitionResult(c,c.revision,{competitionId:'controlled-medal',tournament:'AG',seasonKey:c.world.seasonKey,medal:'GOLD',finalRank:1,officialAppearance:true,registered:true,resultVersion:1}),reviewed=confirmNationalEligibility(gold,gold.revision,'controlled-medal');
 assert.throws(()=>confirmAthleteService(reviewed,reviewed.revision),/NATIONAL_RETURN_REQUIRED/);
 const back=event(reviewed,'E48'),returned=resolveKboNationalEvent(reviewed,reviewed.revision,{eventKey:back.eventKey,eventVersion:back.version,command:'CONFIRM_NATIONAL_RETURN'}).career,duty=confirmAthleteService(returned,returned.revision);
 assert.equal(duty.military!.applications[0]!.decision,'DECLINED');assert.equal(duty.events.find(e=>e.eventKey===pending.eventKey)!.status,'CANCELLED_WITH_REASON');assert.equal(duty.military!.program,undefined);assert.deepEqual(duty.world,c.world);assert.equal(canonicalJson(c),raw);
});
