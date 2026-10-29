import test from 'node:test';
import assert from 'node:assert/strict';
import {abilityKeys} from '@playball/rules';
import {activeUsCareer,preparedUsCareer} from './us-fixtures.js';
import {enteredKboCareer} from './fixtures.js';
import type {UsCareer} from '../src/us-career-entry.js';
import {assertUsCareerRevision} from '../src/us-career-entry.js';
import {canonicalJson} from '../src/game.js';
import {createNationalBracket,nationalInviteDeadlines,nextNationalMatch} from '../src/national-bracket.js';
import {auditCareerNationalDays} from '../src/national-day-audit.js';
import {assertNationalLedger,resolveKboNationalEvent} from '../src/kbo-national.js';
import {openUsNationalSelection,respondUsNationalCallup,startUsNationalTournament,prepareUsNationalMatch,advanceUsNationalMatch,closeUsNationalDay,returnUsNationalTournament,assertUsNationalState,assertUsNationalResponseDeadline,confirmUsAthleteService,advanceUsAthleteDutySeason} from '../src/us-national.js';
import {startUsRegularSeason} from '../src/us-season.js';
import {emptyPitching} from '../src/stats.js';

function sources(){
 // Host identity rename avoids player-key collision; then pin host world/seed/year to the live US root.
 const us=activeUsCareer('PITCHER'),kbo=JSON.parse(JSON.stringify(enteredKboCareer()).replace(/\bown\b/g,'host-own')) as ReturnType<typeof enteredKboCareer>;
 kbo.world.worldKey=us.world.worldKey;kbo.world.seed=us.world.seed;kbo.world.seasonKey=us.world.seasonKey;
 const p=us.world.players[us.protagonistKey]!,key=us.protagonistKey;p.abilities=Object.fromEntries(abilityKeys(p.kind).map(k=>[k,1_000_000]));p.potential={...p.abilities};p.careerPeaks={...p.abilities};
 us.amateurHistory.world.worldKey=us.world.worldKey;us.amateurHistory.world.seed=us.world.seed;
 for(const a of us.amateurHistory.previousSeasons??[]){a.world.worldKey=us.world.worldKey;a.world.seed=us.world.seed;}
 // WBC eligibility needs prior-year KBO/MLB sample; controlled MLB BF is fixture evidence, not a native season.
 const prior=String(Number(us.world.seasonKey)-1),split={BF:50,outs:30,AB:50,H:10,TB:10,HR:0,BB:0,HBP:0,K:10},zero={...split,BF:0,outs:0,AB:0,H:0,TB:0,K:0};
 us.records.games['us-wbc-prior']={gameKey:'us-wbc-prior',worldDay:1,scope:{seasonKey:prior,leagueKey:'MLB',phase:'REGULAR'},teams:{},batting:{},pitching:{[key]:{...emptyPitching(),BF:50,outs:30,games:10,starts:1,starterOuts:30,loadedBF:0,W:0,L:0,SV:0,HLD:0,BS:0,shutouts:0}},batterSplits:{},pitcherSplits:{[key]:{L:zero,R:split}},matchups:{}};us.records.revision++;
 const input=(c=us)=>({worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,kbo,kboRevision:kbo.revision,us:c,usRevision:c.revision,recordProjectionRevision:Math.max(kbo.records.revision,c.records.revision)});
 const b=createNationalBracket({worldKey:us.world.worldKey,seasonKey:us.world.seasonKey,tournament:'WBC',seed:`${us.world.seed}:national:WBC:${us.world.seasonKey}`}),day=nationalInviteDeadlines(b.window).inviteDay;
 return {kbo,us,input,day};
}
function invited(){const f=sources(),c=openUsNationalSelection(f.us,f.us.revision,f.input(),'WBC',f.day);assert.ok(c.national!.invitations.length);return {...f,c};}
function accepted(){const f=invited(),id=f.c.national!.invitations[0]!.selectionId,c=respondUsNationalCallup(f.c,f.c.revision,id,'ACCEPT',f.day);return {...f,c};}

test('US national invitation seals real shared candidates, requires a dated answer and preserves the host',()=>{
 const f=invited(),raw=canonicalJson(f.kbo),n=f.c.national!,id=n.invitations[0]!.selectionId;
 assert.equal(n.selections![0]!.roster.slots.length,28);assert.ok(n.selections![0]!.roster.slots.some(s=>s.playerKey===f.us.protagonistKey));
 assert.throws(()=>assertUsNationalResponseDeadline(f.c,n.invitations[0]!.responseDeadlineDay!),/RESPONSE_REQUIRED/);
 assert.throws(()=>respondUsNationalCallup(f.c,f.c.revision,id,'ACCEPT',f.day-1),/CALLUP_NOT_OPEN/);
 assert.throws(()=>startUsNationalTournament(f.c,f.c.revision,f.input(f.c),'WBC'),/NOT_AVAILABLE|CALLUP_REQUIRED/);
 const declined=respondUsNationalCallup(f.c,f.c.revision,id,'DECLINE',f.day);
 assert.ok(!declined.national!.selections![0]!.roster.slots.some(s=>s.playerKey===f.us.protagonistKey));assert.equal(declined.national!.invitations[0]!.status,'DECLINED');assert.equal(canonicalJson(f.kbo),raw);
});

test('US national pending game JSON resume is deterministic and source roots stay detached',()=>{
 const f=accepted(),raw=canonicalJson(f.c),hostRaw=canonicalJson(f.kbo),started=startUsNationalTournament(f.c,f.c.revision,f.input(f.c),'WBC');
 let c=started;while(c.phaseContext.phase==='INTERNATIONAL_PROGRESS'&&nextNationalMatch(c.national!.brackets![0]!)!.day>c.phaseContext.nextWorldDay)c=closeUsNationalDay(c,c.revision,c.phaseContext.nextWorldDay);
 c=prepareUsNationalMatch(c,c.revision);const partial=advanceUsNationalMatch(c,c.revision,1).career,copy=JSON.parse(JSON.stringify(partial)) as UsCareer;
 assertUsNationalState(copy);assert.equal(canonicalJson(advanceUsNationalMatch(partial,partial.revision,1)),canonicalJson(advanceUsNationalMatch(copy,copy.revision,1)));
 assert.throws(()=>advanceUsNationalMatch(copy,copy.revision-1),/REVISION/);
 const bad=structuredClone(copy);bad.national!.brackets![0]!.pendingGame!.input.seed+='forged';assert.throws(()=>assertUsNationalState(bad),/PENDING_GAME/);
 assert.equal(canonicalJson(f.c),raw);assert.equal(canonicalJson(f.kbo),hostRaw);assert.equal(canonicalJson(started.world),canonicalJson(f.c.world));
});

test('actual WBC games return records, fatigue, health and pitch XP to their owners under both revision checks',()=>{
 const f=accepted(),hostRaw=canonicalJson(f.kbo),openingRecords=structuredClone(f.c.records),openingSeed=f.c.world.seed;let c=startUsNationalTournament(f.c,f.c.revision,f.input(f.c),'WBC');
 for(let limit=0;limit<2000&&c.phaseContext.phase==='INTERNATIONAL_PROGRESS';limit++){
  const b=c.national!.brackets![0]!,m=nextNationalMatch(b),day=c.phaseContext.nextWorldDay;
  if(b.pendingGame)c=advanceUsNationalMatch(c,c.revision).career;
  else if(m?.day===day)c=prepareUsNationalMatch(c,c.revision);
  else c=closeUsNationalDay(c,c.revision,day);
 }
 assert.equal(c.phaseContext.phase,'INTERNATIONAL_REVIEW');assertUsCareerRevision(c,c.revision);
 const before=canonicalJson(c),handoff=returnUsNationalTournament(c,c.revision,f.kbo,f.kbo.revision);
 assert.equal(canonicalJson(c),before);assert.equal(canonicalJson(f.kbo),hostRaw);assert.equal(handoff.expectedUsRevision,c.revision);assert.equal(handoff.expectedKboRevision,f.kbo.revision);
 assert.equal(handoff.career.phaseContext.phase,'PRESEASON_SETUP');assert.equal(handoff.host.phaseContext.phase,'INTERNATIONAL_REVIEW');assert.equal(handoff.career.world.seed,openingSeed);assert.deepEqual(handoff.career.income,f.c.income);
 for(const [key,row]of Object.entries(openingRecords.games))assert.deepEqual(handoff.career.records.games[key],row);
 for(const key of handoff.ownership.recordGameKeys)assert.deepEqual(handoff.host.records.games[key],handoff.career.records.games[key]);
 assert.ok(handoff.ownership.ownerPlayerKeys.includes(c.protagonistKey));assert.ok(!handoff.ownership.kboPlayerKeys.includes(c.protagonistKey));assert.ok(!Object.hasOwn(handoff.host.world.players,c.protagonistKey));assert.ok(handoff.ownership.pitchXpKeys.length>0);
 assert.ok(Object.values(handoff.career.world.repertoires).some(r=>r.ledger.entries.length>0));assertNationalLedger(handoff.host.national,handoff.host.world.worldKey);auditCareerNationalDays(handoff.host);assertUsNationalState(handoff.career);
 assert.throws(()=>returnUsNationalTournament(c,c.revision,{...f.kbo,revision:f.kbo.revision+1},f.kbo.revision+1),/STALE_NATIONAL/);
 const changed=structuredClone(f.kbo);changed.events=[];if(canonicalJson(changed)===hostRaw)changed.relationNotices=[];changed.world.players[changed.protagonistKey]!.fatigue++;assert.throws(()=>returnUsNationalTournament(c,c.revision,changed,f.kbo.revision),/STALE_NATIONAL/);
 assert.throws(()=>returnUsNationalTournament(handoff.career,handoff.career.revision,handoff.host,handoff.host.revision),/NOT_OPEN/);
 const forged=structuredClone(handoff.host);forged.national!.hostReturns![0]!.ownerHealthGames=[];assert.throws(()=>auditCareerNationalDays(forged),/HEALTH/);
 const own=handoff.host.national!.competitions[0]!,key=handoff.host.protagonistKey;
 assert.equal(own.officialAppearance,own.gameKeys!.some(k=>(handoff.host.records.games[k]!.batting[key]?.PA??0)+(handoff.host.records.games[k]!.pitching[key]?.BF??0)>0));
 const e=handoff.host.events.find(e=>e.definitionId==='E48'&&e.status==='OPEN')!;
 const returned=resolveKboNationalEvent(handoff.host,handoff.host.revision,{eventKey:e.eventKey,eventVersion:e.version,command:'CONFIRM_NATIONAL_RETURN'}).career;
 assert.equal(returned.phaseContext.phase,'PRESEASON_SETUP');
});

test('US athlete duty consumes only three distinct finalized full seasons after admission',()=>{
 // Controlled legacy medal/final-growth receipts isolate the annual hook; this is not three native played seasons.
 const prepared=preparedUsCareer(),c=startUsRegularSeason(prepared,prepared.revision),competitionId=JSON.stringify(['national-ag',c.world.worldKey,c.world.seasonKey]);
 c.phaseContext={phase:'SEASON_REVIEW'};c.military.status='ATHLETE_ELIGIBLE';c.national={invitations:[],competitions:[{competitionId,tournament:'AG',seasonKey:c.world.seasonKey,medal:'GOLD',finalRank:1,registered:true,officialAppearance:true,resultVersion:1}],benefits:[{competitionId,benefitKey:JSON.stringify(['national-benefit',competitionId,'ATHLETE_ELIGIBLE']),benefitType:'ATHLETE_ELIGIBLE',appliedRevision:c.revision,resultVersion:1}]};
 const duty=confirmUsAthleteService(c,c.revision),start=Number(duty.national!.athleteDutyStartSeasonKey);advanceUsAthleteDutySeason(duty);assert.equal(duty.national!.athleteDutySeasonsRemaining,3);
 duty.world.seasonKey=String(start);assert.throws(()=>advanceUsAthleteDutySeason(duty),/NOT_CLOSED/);
 duty.season!.growthFinalized={receiptKey:'controlled-final-growth',npcs:{}};duty.seasonGrowth.finalized=true;
 for(let i=0;i<3;i++){duty.world.seasonKey=String(start+i);advanceUsAthleteDutySeason(duty);assert.equal(duty.national!.athleteDutySeasonsRemaining,2-i);advanceUsAthleteDutySeason(duty);assert.equal(duty.national!.athleteDutySeasonsRemaining,2-i);}
 assert.equal(duty.military.status,'COMPLETED');assert.deepEqual(duty.national!.athleteDutySettledSeasons,[String(start),String(start+1),String(start+2)]);
});
