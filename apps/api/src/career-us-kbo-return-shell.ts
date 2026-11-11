import * as engine from '@playball/engine';
import {KBO_CLUBS} from '@playball/rules';
import {spanDeadline} from './span-budget.js';
import type {AppliedCommand,CommandBody,SaveState} from './engine-command.js';
import type {FlowCommand,FlowScreen} from './career-flow-screen.js';

const PREFIX='CAREER_US_KBO_RETURN_';
function fail(code:string):never{throw Object.assign(new Error(code),{code});}

function returnOwners(state:SaveState){
 const c=state.career as engine.UsCareer|undefined;
 const source=state.kboDeparture as engine.KboCareer|undefined;
 const host=state.collegeNationalHost;
 if(!c||c.mode!=='US_CAREER'||!c.kboTransfer?.origin||c.phaseContext.phase!=='SEASON_REVIEW'||
  !source||source.phaseContext?.phase!=='ARCHIVED'||source.revision!==c.kboTransfer.sourceRevision||
  !engine.isCollegeLeagueHost(host)||host.departure?.kboRevision!==source.revision||
  host.departure.usActivationReceiptKey!==c.activation.receiptKey)return null;
 const market=c.contract.type==='US_MAJOR'?c.majorFaWindow:c.contract.type==='US_MINOR'?c.minorMarket:null;
 if(!market||!['COMPLETED','NOT_APPLICABLE'].includes(c.military.status)||
  c.events.some(event=>event.status==='OPEN'&&event.eventKey!==market.eventKey&&event.eventKey!==c.domesticReturn?.eventKey))return null;
 const readiness=engine.usYearTransitionReadiness(c);
 if(readiness.remainingMinorControlSeasons!==0||
  readiness.blockers.some(blocker=>blocker!=='CONTRACT_DECISION_REQUIRED'&&blocker!=='OPEN_EVENT'))return null;
 return {c,source,host,targetSeasonKey:readiness.targetSeasonKey};
}

function authority(c:engine.UsCareer,source:engine.KboCareer,host:engine.CollegeLeagueHost,targetSeasonKey:string):engine.UsKboReturnAuthority {
 engine.assertNpcLeagueHost(host,engine.usNationalNpcOwner(c),host.revision,targetSeasonKey);
 if(host.game.phase!=='PRESEASON_SETUP'||host.game.world.seasonKey!==targetSeasonKey)fail('US_KBO_AUTHORITY_NOT_READY');
 const game=host.game,games:engine.RecordLedger['games']=Object.create(null);
 for(const ledger of [game.records,c.records])for(const [key,row] of Object.entries(ledger.games)){
  if(row.gameKey!==key||(Object.hasOwn(games,key)&&engine.canonicalSeal(games[key])!==engine.canonicalSeal(row)))fail('US_KBO_RECORD_CONFLICT');
  games[key]=row;
 }
 const records={revision:Math.max(game.records.revision,c.records.revision),games},prior=source.npcLeagueHistory;
 const older=prior?.tournaments,latest=host.national;
 const merge=<T>(old:readonly T[]|undefined,current:readonly T[]|undefined,key:(row:T)=>string):T[]=>
  [...new Map([...(old??[]),...(current??[])].map(row=>[key(row),row] as const)).values()];
 const tournaments:typeof latest=older?{...older,...latest,
  invitations:merge(older.invitations,latest.invitations,row=>row.selectionId),
  competitions:merge(older.competitions,latest.competitions,row=>row.competitionId),
  benefits:merge(older.benefits,latest.benefits,row=>row.benefitKey),
  selections:merge(older.selections,latest.selections,row=>row.selectionId),
  brackets:merge(older.brackets,latest.brackets,row=>row.competitionId),
  hostReturns:merge(older.hostReturns,latest.hostReturns,row=>row.competitionId),
  returnedCompetitions:merge(older.returnedCompetitions,latest.returnedCompetitions,id=>id),
  eligibilityReviews:merge(older.eligibilityReviews,latest.eligibilityReviews,id=>id),
 }:latest;
 const current:engine.KboCareer={...source,schemaVersion:7,revision:host.revision,world:game.world,records,health:game.health,
  freeAgents:game.freeAgents,npcLeagueHistory:{tournaments,
   seasons:merge(prior?.seasons,game.seasons,row=>row.seasonKey),
   aiOffseasons:merge(prior?.aiOffseasons,game.aiOffseasons,row=>row.seasonKey),
   national:merge(prior?.national,game.national,row=>JSON.stringify([row.seasonKey,row.type])),
  },
 };
 for(const key of ['rookieDrafts','retiredPlayers','aiAssessments','sangmu'] as const)delete current[key];
 if(game.rookieDrafts)current.rookieDrafts=game.rookieDrafts;
 if(game.retiredPlayers)current.retiredPlayers=game.retiredPlayers;
 if(game.aiAssessments)current.aiAssessments=game.aiAssessments;
 if(game.sangmu)current.sangmu=game.sangmu;
 return {receiptKey:JSON.stringify(['us-kbo-authority',c.activation.receiptKey,game.creationKey]),revision:host.revision,host:current};
}

export function applyUsKboReturn(state:SaveState,body:CommandBody):AppliedCommand{
 const raw=body.payload,name=body.type.slice(PREFIX.length);
 if(!raw||typeof raw!=='object'||Array.isArray(raw))fail('INVALID_PAYLOAD');
 const p=raw as Record<string,unknown>;
 const keys=['careerRevision','hostRevision'];
 if(name==='ACCEPT'||name==='CANCEL')keys.push('eventKey','eventVersion');
 if(name==='ACCEPT')keys.push('offerKey');
 if(Object.keys(p).length!==keys.length||Object.keys(p).some(key=>!keys.includes(key))||
  typeof p.careerRevision!=='number'||!Number.isSafeInteger(p.careerRevision)||p.careerRevision<1||
  typeof p.hostRevision!=='number'||!Number.isSafeInteger(p.hostRevision)||p.hostRevision<0)fail('INVALID_PAYLOAD');
 const owners=returnOwners(state);
 if(!owners)fail('US_KBO_RETURN_NOT_AVAILABLE');
 const {c,source,targetSeasonKey}=owners;
 let host=owners.host,nextState=state,next:engine.KboCareer|engine.UsCareer=c,stopReason:string|undefined,eventIds:string[]=[];
 if(host.revision!==p.hostRevision)fail('STALE_US_KBO_AUTHORITY');
 try{
  engine.assertUsCareerRevision(c,p.careerRevision);
  if(name==='HOST_ADVANCE'){
   if(c.domesticReturn)fail('US_KBO_RETURN_QUOTE_CHANGED');
   const deadline=spanDeadline(),owner=engine.usNationalNpcOwner(c);
   do {
    const result=engine.advanceNpcLeagueHost(host,host.revision,owner,{seasonKey:targetSeasonKey,stopDay:null});
    if(result.host===host){stopReason=result.stopReason;break;}
    host=result.host;stopReason=result.stopReason;
   }while(['CHUNK_LIMIT','DAY_CLOSED','HEALTH_CHANGE','STARTED','POSTSEASON_STARTED','GAME_FINAL','POSTSEASON_COMPLETE','SEASON_REVIEW','YEAR_CLOSED','NEXT_YEAR'].includes(stopReason)&&Date.now()<deadline);
   nextState={...state,collegeNationalHost:host};
  }else if(name==='OPEN'){
   const a=authority(c,source,host,targetSeasonKey),quoted=engine.openUsKboReturn(c,p.careerRevision,source,a,p.hostRevision);
   if(quoted.domesticReturn?.offers.length){next=quoted;nextState={...state,career:next};if(next!==c)eventIds=['E67'];}
   else{
    stopReason='NO_DOMESTIC_OFFERS';
    nextState={...state,kboReturnNoOffer:{careerRevision:c.revision,hostRevision:host.revision}};
   }
  }else if(name==='CANCEL'){
   if(typeof p.eventKey!=='string'||typeof p.eventVersion!=='number'||!Number.isSafeInteger(p.eventVersion))fail('INVALID_PAYLOAD');
   next=engine.declineUsKboReturn(c,p.careerRevision,{eventKey:p.eventKey,eventVersion:p.eventVersion});
   nextState={...state,career:next};
  }else if(name==='ACCEPT'){
   if(typeof p.eventKey!=='string'||typeof p.offerKey!=='string'||typeof p.eventVersion!=='number'||!Number.isSafeInteger(p.eventVersion)||!c.domesticReturn)fail('INVALID_PAYLOAD');
   const a=authority(c,source,host,targetSeasonKey);
   const result=engine.acceptUsKboReturn(c,p.careerRevision,source,a,p.hostRevision,{
    eventKey:p.eventKey,eventVersion:p.eventVersion,offerKey:p.offerKey,worldDay:c.domesticReturn.issuedWorldDay,
   });
   const archive=(state.kboReturnHistory??[]) as readonly {archivedUs:engine.UsCareer;ownership:engine.UsKboOwnershipReceipt}[];
   if(archive.some(row=>row.ownership.receiptKey===result.ownership.receiptKey))fail('US_KBO_OWNERSHIP_ALREADY_COMMITTED');
   next=result.kbo;
   // The command transaction commits the destination, source archive and receipt under one save revision.
   nextState={...state,career:next,kboReturnHistory:[...archive,{archivedUs:result.archivedUs,ownership:result.ownership}]};
   delete nextState.kboDeparture;
   delete nextState.kboReturnNoOffer;
   delete nextState.collegeNationalHost;
  }else fail('UNSUPPORTED_COMMAND');
 }catch(error){fail(error instanceof Error&&/^[A-Z][A-Z0-9_]*$/.test(error.message)?error.message:'INVALID_REQUEST');}
 const phase=next.phaseContext.phase;
 return {nextState,phase,eventIds,summary:{type:body.type,careerRevision:next.revision,phase,hostRevision:host.revision,...(stopReason?{stopReason}:{})}};
}

export function usKboReturnFlow(state:SaveState,fallback:FlowScreen):FlowScreen{
 const owners=returnOwners(state);
 if(!owners)return fallback;
 const {c,host,targetSeasonKey}=owners;
 const cmd=(id:string,label:string,type:string,payload:Record<string,unknown>={}):FlowCommand=>({
  id,label,type:PREFIX+type,payload:{careerRevision:c.revision,hostRevision:host.revision,...payload},
 });
 if(c.domesticReturn?.status==='OPEN'){
  const view=engine.usKboReturnView(c),p=c.world.players[c.protagonistKey]!;
  const commands=view.offers.map(o=>{
   const name=KBO_CLUBS.find(club=>club.id===o.clubId)?.name??o.clubId;
   const label=`${name} · ${o.years}년 · 연봉 ${(o.annualSalaryWon/10_000).toLocaleString('ko-KR')}만 원`;
   return {...cmd('kbo-return-'+o.clubId,label,'ACCEPT',{eventKey:view.eventKey,eventVersion:view.eventVersion,offerKey:o.offerKey}),
    confirm:'이 계약으로 국내 복귀를 확정할까요?',sign:{name:p.name}};
  });
  return {...fallback,title:'국내 복귀 계약 비교',lines:[...fallback.lines,{label:'국내 복귀 시즌',value:targetSeasonKey}],
   commands:[...fallback.commands.filter(o=>o.type!=='CAREER_PRO_RETIRE_REQUEST'),...commands,
    cmd('kbo-return-cancel','현재 경로 유지','CANCEL',{eventKey:view.eventKey,eventVersion:view.eventVersion})]};
 }
 const ready=host.game.phase==='PRESEASON_SETUP'&&host.game.world.seasonKey===targetSeasonKey;
 const empty=state.kboReturnNoOffer as {careerRevision:number;hostRevision:number}|undefined;
 if(ready&&empty?.careerRevision===c.revision&&empty.hostRevision===host.revision){
  return {...fallback,notice:'현재 조건에 맞는 국내 복귀 제안이 없습니다.'};
 }
 return {...fallback,commands:[...fallback.commands,ready?
  cmd('kbo-return-open','국내 복귀 제안 확인','OPEN'):cmd('kbo-return-host','국내 리그 일정 진행','HOST_ADVANCE')]};
}
