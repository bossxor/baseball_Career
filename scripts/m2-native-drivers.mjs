// Native path drivers. Every branch shares one verified creation->HS216 trunk (rows reused, not re-run), so each
// emitted slice is a full creation-to-endpoint command chain. Runner decides proof; nothing here sets a status.
import assert from 'node:assert/strict';
import {highSchoolCareerRouteView} from '../packages/engine/src/high-school-route.ts';
import {recordTotals} from '../packages/engine/src/records.ts';
import {canonicalJson} from '../packages/engine/src/game.ts';
import * as N from './m2-native-paths.mjs';
import {enterCollegeEarlyDraft,returnUnsignedCollegeCareer} from '../packages/engine/src/college-route.ts';
import {prepareCareerKboDraft,resolveCareerKboDraft,decideCareerKboDraft} from '../packages/engine/src/career-kbo.ts';

const prefix=description=>({kind:'NATIVE_FROM_CREATION',creation:'HS_HITTER',description});
const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
const collegeGames=c=>Object.values(c.records.games).filter(g=>g.scope.leagueKey==='COLLEGE'&&g.scope.phase==='REGULAR');

export function nativePaths(trace,only){
 const want=id=>!only||only.includes(id),out=[],cmds=(t,from)=>t.rows.length-from;
 const base=trace('NATIVE-HS-TRUNK',N.createNativeHs(),prefix('Player creation and the actual 216-game HS season.'));N.hsSeason(base);
 const fork=(id,description)=>trace(id,null,prefix(description),base);

 if(want('P01')){
  const t=fork('P01-native-hitter-HS-to-KBO-contract','Creation -> actual HS216 -> actual KBO draft -> signing -> HS close -> KBO activation.');
  N.toRoute(t);
  const view=highSchoolCareerRouteView(t.state),player=t.state.world.players.own;
  // Preference is a tie-break only: pick a club that the draft really does not give us.
  const preferred=N.clubIds().find(id=>N.probeDraft(t.state,id).clubId!==id);assert.ok(preferred,'no non-guaranteed preference found');
  const draft=N.kboSign(t,preferred);
  assert.notEqual(draft.draftedClubId,draft.preferredClubId);
  assert.equal(Object.keys(player.abilities).length,6);assert.equal(player.focus.length,4);
  assert.ok(Math.abs(view.overall-mean(Object.values(player.abilities))/10000)<1e-9,'route overall must be the mean of the six abilities');
  assert.equal(t.state.world.contracts[t.state.protagonistKey].clubId,draft.draftedClubId);
  out.push(t.finish({completesPaths:['P01'],abilities:6,focusSlots:4,averageOverall:view.overall,preferredClubId:draft.preferredClubId,draftedClubId:draft.draftedClubId,preferenceNotGuaranteed:true,draftRound:draft.round,screensNotExercised:'S01-S05/S28 are M4/M5',jsonReplay:'every command',sourceImmutability:'every command'}));
 }

 if(want('P07')){
  const t=fork('P07-native-US-ineligible-to-other-route','Creation -> actual HS216 -> US direct inventory supplied as external input (budget3M all 30 orgs) -> card hidden -> KBO draft signing.');
  N.toRoute(t);
  const view=N.usDirectView(t,3000000);
  assert.equal(view.visible,false);assert.equal(view.offers.length,0);
  const draft=N.kboSign(t,null);
  out.push(t.finish({completesPaths:['P07'],usCardVisible:false,usOffers:0,alternateRoute:'KBO',draftedClubId:draft.draftedClubId,externalInput:'US roster world + inventory (budget 3,000,000 USD per org) are caller supplied, as in career-us.test',jsonReplay:'every command',sourceImmutability:'every command'}));
 }

 const wantCollege=['P03','P04','P05','P12'].some(want);
 if(wantCollege){
  const tc=fork('NATIVE-COLLEGE-TRUNK','Creation -> HS216 -> college admission.');N.toRoute(tc);N.collegeEnroll(tc);
  if(want('P12')){
   const t=trace('P12-native-college-leave-service-resume',null,prefix('Creation -> actual HS216 -> admission -> actual leave, 18-month service days, resume.'),tc);
   const old=canonicalJson(t.state.records),age=t.state.world.players.own.age,from=t.rows.length;
   const year=N.collegeLeave(t);
   assert.equal(t.state.collegeAdmission.academicYear,year);assert.ok(t.state.world.players.own.age>age);assert.equal(canonicalJson(t.state.records),old);assert.equal(t.state.days.days.length,0);
   out.push(t.finish({completesPaths:['P12'],ageAdvanced:true,academicYearFrozen:true,priorRecordsUnchanged:true,pastScheduleReplay:0,serviceClosedDays:t.state.collegeService.closedDays.length,serviceCommands:cmds(t,from),jsonReplay:'every command',sourceImmutability:'every command'}));
  }
  if(want('P03')||want('P04')||want('P05')){
   N.collegeYear(tc);
   const y1=collegeGames(tc.state).length;
   const growth=N.collegeNextYear(tc);
   assert.equal(tc.state.collegeAdmission.academicYear,2);assert.equal(tc.state.collegeAdmission.yearsCompleted,1);
   assert.equal(Object.values(tc.state.records.games).filter(g=>g.scope.leagueKey==='HS').length,216);
   if(want('P03')){
    const totals=recordTotals(tc.state.records,{leagueKey:'COLLEGE',phase:'REGULAR',seasonKey:Object.values(tc.state.records.games).find(g=>g.scope.leagueKey==='COLLEGE').scope.seasonKey});
    out.push(trace('P03-native-HS-college-year1-to-year2',null,prefix('Creation -> actual HS216 -> admission -> actual college216-game year, cup, review, year close and second-year entry.'),tc).finish({completesPaths:['P03'],collegeRegularGames:y1,teamGameCounts:[...new Set(Object.values(totals.teams).map(x=>x.games))],academicYear:2,yearsCompleted:1,growthLedger:growth,growthDuplicateZero:true,hsRecordsPreserved:true,note:'Branch shares trunk rows; no extra command executed.'}));
   }
  if(want('P04')){
   // Native draw gives this player a pick (undrafted branch not reachable), so only the DECLINE variant (drafted, unsigned) is executed.
   N.collegeYear(tc);
   const t=trace('P04-native-decline-variant',null,prefix('Creation -> HS216 -> two native college years -> E73 early draft -> native pick DECLINED -> E74 return -> third-year entry. Variant: the path asks for an undrafted outcome; this player is drafted, so P04 is NOT claimed.'),tc);
   t.command('ENTER_EARLY_DRAFT',{eventVersion:t.state.events.at(-1).version},s=>enterCollegeEarlyDraft(s,s.revision,s.events.at(-1).version));
   t.command('PREPARE_KBO_DRAFT',{},s=>prepareCareerKboDraft(s,s.revision));t.command('RESOLVE_KBO_DRAFT',{programVersion:1},s=>resolveCareerKboDraft(s,s.revision,1));
   const round=t.state.kboRecruitment.program.result.round;
   const decline={programVersion:2,decision:'DECLINE'};if(round)t.command('DECLINE_KBO_DRAFT',decline,s=>decideCareerKboDraft(s,s.revision,decline));
   t.command('RETURN_UNSIGNED_COLLEGE',{eventVersion:t.state.events.at(-1).version},s=>returnUnsignedCollegeCareer(s,s.revision,s.events.at(-1).version));
   N.collegeNextYear(t);
   assert.equal(t.state.collegeAdmission.academicYear,3);assert.equal(t.state.collegeAdmission.earlyDraftAttempted,true);assert.equal(t.state.previousKboRecruitments.length,1);
   out.push(t.finish({variantOf:'P04',draftRound:round,undraftedBranch:!round,declined:Boolean(round),returnEnrollmentPreserved:true,earlyAttempts:1,jsonReplay:'every command'}));
  }
  if(want('P05')){
   if(!want('P04'))N.collegeYear(tc);
   const growth=[N.collegeNextYear(tc)];N.collegeYear(tc);growth.push(N.collegeNextYear(tc));N.collegeYear(tc);
   assert.equal(tc.state.collegeAdmission.academicYear,4);
   const t=trace('P05-native-college-year4-graduation-to-KBO',null,prefix('Creation -> HS216 -> four native college years -> graduation -> KBO draft, signing, activation.'),tc);
   const from=t.rows.length,draft=N.collegeGraduateAndSign(t);
   const games=collegeGames(t.state).length;assert.equal(games,864);
   out.push(t.finish({completesPaths:['P05'],graduated:true,collegeRegularGames:games,collegeRecordsSeparateFromHs:Object.values(t.state.records.games).some(g=>g.scope.leagueKey==='HS')&&games===864,growthLaterYears:growth,draftedClubId:draft.draftedClubId,draftRound:draft.round,graduationCommands:cmds(t,from),jsonReplay:'every command'}));
  }
  }
 }
 return out;
}
