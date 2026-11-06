import test from 'node:test';
import assert from 'node:assert/strict';
import {completedCollegeRegularSeason,enrolledCollegeCareer,completedHighSchoolCareer} from './fixtures.js';
import {remainderDecisionCareer} from './remainder-fixtures.js';
import {canonicalJson} from '../src/game.js';
import {startCollegeCup,advanceCollegeCup} from '../src/college-cup.js';
import {startCollegeMilitaryLeave,collegeLeaveElapsedYears,advanceCollegeMilitaryService} from '../src/college-service.js';
import {offerKboRemainderRenewal,compareKboRemainderOffers,acceptKboRemainderRenewal,kboRemainderRenewalView} from '../src/kbo-remainder-renewal.js';
import {requestAmateurRetirement,resolveAmateurRetirement} from '../src/amateur-retirement.js';
import {acknowledgeHighSchoolSeasonReview,openHighSchoolCareerRoute} from '../src/high-school-route.js';

const SEAL=/^sha256:[0-9a-f]{64}$/;
const small=(s:string)=>{assert.match(s,SEAL);assert.equal(s.length,71);};

test('college cup stores a 71-byte regular basis and still accepts the old raw-JSON basis',()=>{
 const source=completedCollegeRegularSeason(),cup=startCollegeCup(source,source.revision);
 small(cup.collegeCup!.regularBasis);
 const games=source.world.schedule.map(g=>source.records.games[g.simulationKey]),raw=canonicalJson({schedule:source.world.schedule,games});
 console.log('SIZE collegeCup.regularBasis',raw.length,'->',cup.collegeCup!.regularBasis.length);
 const legacy=structuredClone(cup);legacy.collegeCup!.regularBasis=raw;
 assert.doesNotThrow(()=>advanceCollegeCup(legacy,legacy.revision));
 const forged=structuredClone(cup);forged.collegeCup!.regularBasis='sha256:'+'0'.repeat(64);assert.throws(()=>advanceCollegeCup(forged,forged.revision),/BASIS/);
});

test('college military leave stores hash seals and accepts old raw-JSON source/records seals',()=>{
 const s=enrolledCollegeCareer(),leave=startCollegeMilitaryLeave(s,s.revision),p=leave.collegeService!;
 small(p.sourceEvidence);small(p.sourceRecordsBasis);
 console.log('SIZE collegeService.sourceEvidence',canonicalJson(p.source).length,'->',p.sourceEvidence.length);
 console.log('SIZE collegeService.sourceRecordsBasis',canonicalJson(s.records).length,'->',p.sourceRecordsBasis.length);
 const legacy=structuredClone(leave);legacy.collegeService!.sourceEvidence=canonicalJson(p.source);legacy.collegeService!.sourceRecordsBasis=canonicalJson(s.records);
 const next=advanceCollegeMilitaryService(legacy,legacy.revision,31).career;assert.ok(next.collegeService);
 const forged=structuredClone(leave);forged.collegeService!.sourceEvidence='sha256:'+'0'.repeat(64);assert.throws(()=>collegeLeaveElapsedYears(forged),/STALE_COLLEGE_SERVICE_EVIDENCE/);
 // SERVING (not RESUMED) passes the seal check and only then fails on the interval rule
 assert.throws(()=>collegeLeaveElapsedYears(structuredClone(leave)),/INVALID_COLLEGE_LEAVE_INTERVAL/);
 // year evidence: accumulate one yearly archive through the service and compare both formats
 let c=leave;for(let i=0;i<40&&c.phaseContext.phase==='SERVICE_PROGRESS';i++)c=advanceCollegeMilitaryService(c,c.revision,31).career;
 const years=c.collegeService!.years,evidence=c.collegeService!.yearEvidence;
 evidence.forEach(e=>small(e));
 if(years.length){const old=structuredClone(c);old.collegeService!.yearEvidence=years.map(y=>canonicalJson(y));assert.doesNotMatch(String((()=>{try{collegeLeaveElapsedYears(old);return '';}catch(e){return (e as Error).message;}})()),/STALE/);
  console.log('SIZE collegeService.yearEvidence[0]',canonicalJson(years[0]).length,'->',evidence[0]!.length);}
});

test('KBO remainder renewal stores hash seals and accepts old raw-JSON basis and comparison',()=>{
 const base=remainderDecisionCareer(),offered=offerKboRemainderRenewal(base,base.revision),r=offered.remainderRenewal!;
 small(r.sourceBasis);
 const v=kboRemainderRenewalView(offered)!,request={eventKey:v.eventKey,eventVersion:v.eventVersion};
 const compared=compareKboRemainderOffers(offered,offered.revision,request).career,cmp=compared.remainderRenewal!.comparison!;
 small(cmp.sourceBasis);
 const c=compared,rawOffer=canonicalJson({contract:c.world.contracts[c.protagonistKey],schedule:c.competitionSchedule,club:c.world.clubs.find(x=>x.id===c.protagonistClubId),player:c.world.players[c.protagonistKey],recordsRevision:c.records.revision,lastClosedDay:c.days?.days.at(-1)?.day});
 const rawCmp=canonicalJson({world:offered.world,health:offered.health,recordsRevision:offered.records.revision,schedule:offered.competitionSchedule});
 console.log('SIZE kboRemainder.offer.sourceBasis',rawOffer.length,'->',r.sourceBasis.length);
 console.log('SIZE kboRemainder.comparison.sourceBasis',rawCmp.length,'->',cmp.sourceBasis.length);
 const legacy=structuredClone(compared);legacy.remainderRenewal!.sourceBasis=rawOffer;legacy.remainderRenewal!.comparison!.sourceBasis=rawCmp;
 assert.doesNotThrow(()=>acceptKboRemainderRenewal(legacy,legacy.revision,request));
 const forged=structuredClone(compared);forged.remainderRenewal!.comparison!.sourceBasis='sha256:'+'0'.repeat(64);assert.throws(()=>acceptKboRemainderRenewal(forged,forged.revision,request),/OFFER_CHANGED/);
});

test('amateur retirement stores a 71-byte source basis and accepts the old raw-JSON basis',()=>{
 let c=structuredClone(completedHighSchoolCareer());c=acknowledgeHighSchoolSeasonReview(c,c.revision);const source=openHighSchoolCareerRoute(c,c.revision,1).career;
 const opened=requestAmateurRetirement(source,source.revision),e=opened.events.at(-1)!;small(opened.amateurRetirement!.sourceBasis);
 const input={eventKey:e.eventKey,eventVersion:e.version,command:'CONFIRM_RETIRE' as const};
 const x=source,raw=canonicalJson({world:x.world,records:x.records,health:x.health,days:x.days,development:x.development??null,seasonGrowth:x.seasonGrowth??null,
  traits:x.traits?{...x.traits,summaryCursor:0}:null,relationships:x.relationships??null,styleUsedWindows:x.styleUsedWindows,planHistory:x.planHistory,
  graduation:x.graduation??null,collegeAdmission:x.collegeAdmission??null,collegeResult:x.collegeResult??null,collegeCup:x.collegeCup??null,
  collegeGraduation:x.collegeGraduation??null,collegeEarlyRoute:x.collegeEarlyRoute??null,collegeService:x.collegeService??null,national:x.national??null,
  retryCareer:x.retryCareer??null,preparation:x.preparation??null,kboRecruitment:x.kboRecruitment??null,usRecruitment:x.usRecruitment??null,events:x.events,phase:x.phaseContext});
 console.log('SIZE amateurRetirement.sourceBasis',raw.length,'->',opened.amateurRetirement!.sourceBasis.length);
 const legacy=structuredClone(opened);legacy.amateurRetirement!.sourceBasis=raw;
 assert.doesNotThrow(()=>resolveAmateurRetirement(legacy,legacy.revision,input));
});
