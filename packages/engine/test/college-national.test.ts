import test from 'node:test';
import assert from 'node:assert/strict';
import {abilityKeys} from '@playball/rules';
import {completedCollegeAcademicYear,enrolledCollegeCareer,enteredKboCareer} from './fixtures.js';
import {canonicalJson} from '../src/game.js';
import type {HighSchoolCareer} from '../src/high-school-career.js';
import {assertCollegeCareerRevision} from '../src/high-school-career.js';
import {confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {startKboRegularSeason} from '../src/kbo-progress.js';
import {createNationalBracket,nationalInviteDeadlines,nextNationalMatch} from '../src/national-bracket.js';
import {auditCareerNationalDays} from '../src/national-day-audit.js';
import {collegeCupSchedule} from '../src/college-cup.js';
import {collectRegisteredSchoolGrowthEvidence} from '../src/high-school-growth.js';
import {closeCollegeSeasonForNextYear,startNextCollegeSeason} from '../src/college-year.js';
import {openCollegeNationalSelection,respondCollegeNationalCallup,startCollegeNationalTournament,prepareCollegeNationalMatch,advanceCollegeNationalMatch,closeCollegeNationalDay,returnCollegeNationalTournament,assertCollegeNationalState,assertCollegeNationalResponseDeadline,confirmCollegeNationalEligibility,advanceCollegeAthleteDutySeason,schoolNationalEndInjured} from '../src/college-national.js';

function accepted(){
 // Controlled school regular scores and KBO pre-window dates isolate actual AG ownership; neither is a native domestic season.
 const college=enrolledCollegeCareer('PITCHER'),p=college.world.players.own!;
 p.abilities=Object.fromEntries(abilityKeys(p.kind).map(k=>[k,1_000_000]));p.potential={...p.abilities};p.careerPeaks={...p.abilities};college.development!.seasonStartPlayer=structuredClone(p);
 const c=completedCollegeAcademicYear(college),renamed=JSON.parse(JSON.stringify(enteredKboCareer()).replace(/\bown\b/g,'host-own')) as ReturnType<typeof enteredKboCareer>;
 const planned=confirmKboPreseasonPlan(renamed,renamed.revision),opening=confirmKboOpeningRoster(planned,planned.revision),scheduled=confirmKboSeasonSchedule(opening,opening.revision),kbo=startKboRegularSeason(scheduled,scheduled.revision);
 const bracket=createNationalBracket({worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,tournament:'AG',seed:`${c.world.seed}:national:AG:${c.world.seasonKey}`}),start=bracket.window.startDay,first=kbo.phaseContext.phase==='SEASON_PROGRESS'?kbo.phaseContext.nextWorldDay:0;
 kbo.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:start,pendingGame:null};kbo.days={...kbo.days!,days:Array.from({length:start-first},(_,i)=>({day:first+i,evidence:'controlled-prefix',result:{injured:[],recovered:[]}}))};
 const input=(college=c)=>({kbo,kboRevision:kbo.revision,college,collegeRevision:college.revision,recordProjectionRevision:Math.max(kbo.records.revision,college.records.revision)}),day=nationalInviteDeadlines(bracket.window).inviteDay;
 const invited=openCollegeNationalSelection(c,c.revision,input(),'AG',day),invitation=invited.national!.invitations[0]!;
 assert.ok(invitation);assert.throws(()=>assertCollegeNationalResponseDeadline(invited,invitation.responseDeadlineDay!),/RESPONSE_REQUIRED/);
 return {kbo,input,day,invited,c:respondCollegeNationalCallup(invited,invited.revision,invitation.selectionId,'ACCEPT',day)};
}

test('college AG pending game JSON resume preserves both source roots and rejects stale/changed academic evidence',()=>{
 const f=accepted(),raw=canonicalJson(f.c),hostRaw=canonicalJson(f.kbo);let c=startCollegeNationalTournament(f.c,f.c.revision,f.input(f.c));
 while(c.phaseContext.phase==='INTERNATIONAL_PROGRESS'&&nextNationalMatch(c.national!.brackets![0]!)!.day>c.phaseContext.nextWorldDay)c=closeCollegeNationalDay(c,c.revision,c.phaseContext.nextWorldDay);
 c=prepareCollegeNationalMatch(c,c.revision);const partial=advanceCollegeNationalMatch(c,c.revision,1).career,restored=JSON.parse(JSON.stringify(partial)) as HighSchoolCareer;
 assertCollegeCareerRevision(restored,restored.revision);assertCollegeNationalState(restored);
 // Scalar boundary probe only: a later health flag cannot rewrite the captured academic interval.
 const laterHealth=structuredClone(restored),endInjured=schoolNationalEndInjured(restored,'own');
 if(endInjured)delete laterHealth.health.injuries.own;
 else laterHealth.health.injuries.own={severity:'MILD',remainingTeamGames:3,diagnosedGameKey:'controlled-later-health-probe',seasonKey:laterHealth.world.seasonKey};
 assert.equal(schoolNationalEndInjured(laterHealth,'own'),endInjured);
 assert.equal(canonicalJson(advanceCollegeNationalMatch(partial,partial.revision,1)),canonicalJson(advanceCollegeNationalMatch(restored,restored.revision,1)));
 assert.throws(()=>advanceCollegeNationalMatch(restored,restored.revision-1),/REVISION/);
 for(const change of [
  (s:HighSchoolCareer)=>{s.national!.brackets![0]!.pendingGame!.input.seed+='forged';},
  (s:HighSchoolCareer)=>{s.days.days[0]!.evidence='forged';},
  (s:HighSchoolCareer)=>{s.collegeResult!.championKey='forged';},
  (s:HighSchoolCareer)=>{s.health.games[0]!.evidence.roster=[];},
  (s:HighSchoolCareer)=>{s.national!.sessions![0]!.schoolHealth.rng.draws++;},
  (s:HighSchoolCareer)=>{Object.values(s.records.games)[0]!.worldDay++;},
 ]){const bad=structuredClone(restored);change(bad);assert.throws(()=>assertCollegeCareerRevision(bad,bad.revision),/PENDING_GAME|SCHOOL_|SOURCE/);}
 assert.equal(canonicalJson(f.c),raw);assert.equal(canonicalJson(f.kbo),hostRaw);
});

test('actual college AG returns each owner records/health/XP while preserving academic receipts and closing its real KBO host dates',()=>{
 const f=accepted(),hostRaw=canonicalJson(f.kbo),schoolDays=canonicalJson(f.c.days),schoolCup=canonicalJson(f.c.collegeCup);let c=startCollegeNationalTournament(f.c,f.c.revision,f.input(f.c));
 for(let limit=0;limit<300&&c.phaseContext.phase==='INTERNATIONAL_PROGRESS';limit++){
  const b=c.national!.brackets![0]!,m=nextNationalMatch(b),day=c.phaseContext.nextWorldDay;
  if(b.pendingGame)c=advanceCollegeNationalMatch(c,c.revision).career;
  else if(m?.day===day)c=prepareCollegeNationalMatch(c,c.revision);
  else c=closeCollegeNationalDay(c,c.revision,day);
 }
 assert.equal(c.phaseContext.phase,'INTERNATIONAL_REVIEW');assertCollegeCareerRevision(c,c.revision);
 const benefit=c.national!.benefits[0];if(benefit)c=confirmCollegeNationalEligibility(c,c.revision,benefit.competitionId);
 const before=canonicalJson(c),out=returnCollegeNationalTournament(c,c.revision,f.kbo,f.kbo.revision);
 assert.equal(canonicalJson(c),before);assert.equal(canonicalJson(f.kbo),hostRaw);assert.equal(out.expectedCollegeRevision,c.revision);assert.equal(out.expectedKboRevision,f.kbo.revision);
 assert.equal(canonicalJson(out.career.days),schoolDays);assert.equal(canonicalJson(out.career.collegeCup),schoolCup);assert.equal(out.career.phaseContext.phase,'OFFSEASON_REVIEW');
 assert.equal(out.career.collegeResult!.recordRevision,out.career.records.revision);assert.equal(out.career.collegeResult!.championKey,f.c.collegeResult!.championKey);
 assert.ok(out.ownership.ownerPlayerKeys.includes('own'));assert.ok(!Object.hasOwn(out.host.world.players,'own'));assert.ok(out.ownership.recordGameKeys.length>=16);
 for(const key of out.ownership.recordGameKeys)assert.deepEqual(out.host.records.games[key],out.career.records.games[key]);
 auditCareerNationalDays(out.host);assertCollegeNationalState(out.career);
 const evidence=collectRegisteredSchoolGrowthEvidence(out.career,[...out.career.world.schedule,...collegeCupSchedule(out.career)],false);assert.equal(evidence.days.length,out.career.days.days.length);
 assert.equal(schoolNationalEndInjured(out.career,'own'),Object.hasOwn(out.career.national!.sessions![0]!.schoolHealth.injuries,'own'));
 assert.throws(()=>returnCollegeNationalTournament(c,c.revision,{...f.kbo,revision:f.kbo.revision+1},f.kbo.revision+1),/STALE_NATIONAL/);
 const changed=structuredClone(f.kbo);changed.world.players[changed.protagonistKey]!.fatigue++;assert.throws(()=>returnCollegeNationalTournament(c,c.revision,changed,changed.revision),/STALE_NATIONAL/);
 assert.throws(()=>returnCollegeNationalTournament(out.career,out.career.revision,out.host,out.host.revision),/NOT_OPEN/);
 const bad=structuredClone(out.career),row=Object.values(bad.records.games).find(g=>g.scope.phase==='INTERNATIONAL')!;row.teams[Object.keys(row.teams)[0]!]!.R++;assert.throws(()=>assertCollegeCareerRevision(bad,bad.revision),/GAME_EVIDENCE/);
});

test('college duty consumes a distinct finalized academic season only after growth/health closure and seals the updated balance',()=>{
 // Controlled legacy earned benefit isolates annual duty; this does not claim three played years or a native medal.
 const source=completedCollegeAcademicYear(),competitionId='controlled-earned-ag';
 source.national={invitations:[],competitions:[{competitionId,tournament:'AG',seasonKey:'2026',medal:'GOLD',finalRank:1,registered:true,officialAppearance:true,resultVersion:1}],benefits:[{competitionId,benefitKey:JSON.stringify(['national-benefit',competitionId,'ATHLETE_ELIGIBLE']),benefitType:'ATHLETE_ELIGIBLE',appliedRevision:1,resultVersion:1}],militaryStatus:'ATHLETE_SERVICE',athleteDutyStartSeasonKey:'2030',athleteDutySettledSeasons:[],athleteDutySeasonsRemaining:3};
 assert.throws(()=>advanceCollegeAthleteDutySeason(source),/NOT_CLOSED/);
 const before=canonicalJson(source),ready=closeCollegeSeasonForNextYear(source,source.revision,true);assert.equal(ready.national!.athleteDutySeasonsRemaining,2);assert.deepEqual(ready.national!.athleteDutySettledSeasons,['2030']);advanceCollegeAthleteDutySeason(ready);assert.equal(ready.national!.athleteDutySeasonsRemaining,2);assert.equal(canonicalJson(source),before);
 const next=startNextCollegeSeason(JSON.parse(JSON.stringify(ready)),ready.revision);assert.equal(next.national!.athleteDutySeasonsRemaining,2);assert.throws(()=>advanceCollegeAthleteDutySeason(next),/NOT_CLOSED/);
 const forged=structuredClone(ready);forged.national!.athleteDutySeasonsRemaining=1;assert.throws(()=>startNextCollegeSeason(forged,forged.revision),/ATHLETE_DUTY|YEAR_END/);
});
