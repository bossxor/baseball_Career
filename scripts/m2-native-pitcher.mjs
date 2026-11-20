import assert from 'node:assert/strict';
import {PITCHER_ABILITIES,PITCH_XP} from '@playball/rules';
import {resolveKboCallup} from '../packages/engine/src/kbo-callup.ts';
import {confirmKboOpeningRoster} from '../packages/engine/src/kbo-opening-roster.ts';
import {confirmKboPreseasonPlan,setKboPreseasonPitchWeights} from '../packages/engine/src/kbo-preseason.ts';
import {advanceKboCareer,startKboRegularSeason} from '../packages/engine/src/kbo-progress.ts';
import {confirmKboSeasonSchedule} from '../packages/engine/src/kbo-schedule.ts';
import {resolveKboWindowEvent} from '../packages/engine/src/kbo-windows.ts';
import {validatePitchXpLedger} from '../packages/engine/src/pitch-xp.ts';
import {proCareerAdviceView,resolveProCareerAdviceEvent} from '../packages/engine/src/pro-career-advice.ts';
import {resolveProHiddenTraitNotice} from '../packages/engine/src/pro-trait-notices.ts';
import {validatePitchWeights} from '../packages/engine/src/repertoire.ts';
import {careerRepertoireEventsView,refreshCareerRepertoireEvents,resolveCareerRepertoireEvent} from '../packages/engine/src/repertoire-events.ts';
import {createNativePitcherHs,hsSeason,kboSign,toRoute} from './m2-native-paths.mjs';

const pitchId='P07',weights={P01:65,P03:35};
const roleCommands={E14:'REQUEST_SP_REVIEW',E15:'REQUEST_CP_REVIEW'};
const blockingChoices={
 E09:['ACCEPT_CALLUP',resolveKboCallup],E41:['ACK_EVENT',resolveKboWindowEvent],
 E43:['DEFER_TRAINING',resolveKboWindowEvent],E84:['OPEN_TRAITS',resolveProHiddenTraitNotice],
};

function resolveBlockingEvent(t){
 const event=t.state.events.find(e=>e.eventKey===t.state.phaseContext.eventKey);
 assert.ok(event,'missing KBO blocking event');
 const choice=blockingChoices[event.definitionId];
 assert.ok(choice,'unsupported KBO event '+event.definitionId);
 const [command,apply]=choice,input={eventKey:event.eventKey,eventVersion:event.version,command};
 t.command('resolve:'+event.definitionId,input,s=>apply(s,s.revision,input));
}

function tryRoleReview(t){
 const c=t.state;
 if(c.phaseContext.phase!=='SEASON_PROGRESS'||c.phaseContext.pendingGame||!c.advice?.notices.some(e=>e.status==='OPEN'&&Object.hasOwn(roleCommands,e.definitionId)))return null;
 const event=proCareerAdviceView(c).notices.find(e=>e.commands.includes(roleCommands[e.definitionId]));
 if(!event)return null;
 const input={eventKey:event.eventKey,eventVersion:event.eventVersion,command:roleCommands[event.definitionId]};
 t.command('REQUEST_PITCHER_ROLE_REVIEW',input,s=>resolveProCareerAdviceEvent(s,s.revision,input));
 const receipt=t.state.advice.roleReviews.at(-1);
 assert.equal(receipt.eventKey,event.eventKey);
 assert.ok(['ROLE_CHANGED','OTHER_CANDIDATE'].includes(receipt.outcome));
 assert.equal(t.state.world.players[c.protagonistKey].position,receipt.outcome==='ROLE_CHANGED'?receipt.targetRole:'RP');
 return receipt;
}

export function nativePitcherPath(trace){
 const t=trace('P02-native-pitcher-role-and-learning',createNativePitcherHs(),{kind:'NATIVE_FROM_CREATION',creation:'HS_PITCHER',description:'Pitcher creation, actual HS216, KBO draft and entry, offseason pitch allocation and training reservation, actual in-season role competition and later training XP.'});
 hsSeason(t);toRoute(t);const draft=kboSign(t),key=t.state.protagonistKey;
 const player=t.state.world.players[key];
 assert.equal(player.kind,'PITCHER');assert.equal(player.position,'RP');
 assert.deepEqual(Object.keys(player.abilities).sort(),[...PITCHER_ABILITIES].sort());
 assert.ok(Object.hasOwn(player.abilities,'PICKOFF'));
 t.command('SET_PITCH_WEIGHTS',{weights},s=>setKboPreseasonPitchWeights(s,s.revision,weights));
 t.command('REFRESH_REPERTOIRE_EVENTS',{},s=>refreshCareerRepertoireEvents(s));
 const event=careerRepertoireEventsView(t.state).notices.find(e=>e.definitionId==='E86'&&e.commands.includes('SET_PITCH_TRAINING'));assert.ok(event);
 const input={eventKey:event.eventKey,eventVersion:event.eventVersion,command:'SET_PITCH_TRAINING',pitchId};
 t.command('SET_PITCH_TRAINING',input,s=>resolveCareerRepertoireEvent(s,s.revision,input));
 const book=()=>t.state.world.repertoires[key];
 assert.equal(book().ledger.baseReservedUnits,100_000);
 t.command('CONFIRM_KBO_PRESEASON',{},s=>confirmKboPreseasonPlan(s,s.revision));
 t.command('CONFIRM_KBO_ROSTER',{},s=>confirmKboOpeningRoster(s,s.revision));
 t.command('CONFIRM_KBO_SCHEDULE',{},s=>confirmKboSeasonSchedule(s,s.revision));
 t.command('START_KBO_SEASON',{},s=>startKboRegularSeason(s,s.revision));

 let roleReview=null, quartersAtRoleReview=null;
 for(let step=0;t.state.phaseContext.phase!=='SEASON_REVIEW';step++){
  assert.ok(step<1_800,'native KBO command budget exhausted');
  if(t.state.phaseContext.phase==='EVENT_DECISION'){resolveBlockingEvent(t);continue;}
  assert.equal(t.state.phaseContext.phase,'SEASON_PROGRESS');
  if(!roleReview){roleReview=tryRoleReview(t);if(roleReview)quartersAtRoleReview=book().learning.quarters.length;}
  if(book().learning.quarters.length===4)break;
  t.command(roleReview?'ADVANCE_KBO_AFTER_ROLE_REVIEW':'ADVANCE_KBO',{maxDays:1},s=>{
   const out=advanceKboCareer(s,s.revision,1);assert.notEqual(out.stopReason,'ENGINE_LIMIT');return out;
  });
  if(roleReview&&book().learning.quarters.length>quartersAtRoleReview&&book().ledger.entries.some(row=>{
   const [season,kind,id,quarter]=JSON.parse(row.evidenceKey);
   return season===t.state.world.seasonKey&&kind==='learning'&&id===pitchId&&quarter>quartersAtRoleReview&&row.bookGain>0;
  }))break;
 }
 const repertoire=book();validatePitchWeights(repertoire.book,repertoire.weights);validatePitchXpLedger(repertoire.ledger);
 assert.deepEqual(repertoire.weights,weights);
 assert.ok(repertoire.ledger.baseSpentUnits+repertoire.ledger.baseReservedUnits<=PITCH_XP.baseSeasonCapUnits);
 const quarterGains=repertoire.ledger.entries.flatMap(row=>{
  const [season,kind,id,quarter]=JSON.parse(row.evidenceKey);
  return season===t.state.world.seasonKey&&kind==='learning'&&id===pitchId&&row.bookGain>0?[{quarter,gain:row.bookGain}]:[];
 });
 const afterReview=roleReview&&quarterGains.some(row=>row.quarter>quartersAtRoleReview);
 const report={highSchoolGames:216,draftRound:draft.round,pickoffInSixAbilities:true,pitchWeights:repertoire.weights,baseXpSpent:repertoire.ledger.baseSpentUnits,baseXpReserved:repertoire.ledger.baseReservedUnits,roleReview,quartersAtRoleReview,quarterGains,checkpoints:t.state.advice?.checkpoints??[]};
 return t.finish(afterReview?{...report,completesPaths:['P02'],trainingReservedBeforeRoleReview:true}:{...report,variantOf:'P02',unproven:[...(roleReview?[]:['native E14/E15 role review']),'positive training XP after role review']});
}
