import * as engine from '@playball/engine';
import type {AppliedCommand,CommandBody,SaveState} from './engine-command.js';
import type {FlowCommand,FlowScreen} from './career-flow-screen.js';

const prefix='CAREER_KBO_DEPARTURE_';
const usProAcquisitionBudgetUsd=80_000_000;
const commands=new Map<string,readonly string[]>([
 ['POSTING_INVITE',[]],['POSTING_REQUEST',['eventKey','eventVersion']],['POSTING_DECLINE',['eventKey','eventVersion']],
 ['POSTING_DECIDE',[]],['POSTING_ACK_DEFERRED',['eventKey','eventVersion']],['POSTING_OPEN_OFFERS',['eventKey','eventVersion']],
 ['POSTING_SIGN',['eventKey','eventVersion','offerKey']],['POSTING_REMAIN',['eventKey','eventVersion']],['POSTING_EXPIRE',[]],
 ['OVERSEAS_OPEN',[]],['OVERSEAS_SIGN',['offerKey']],['OVERSEAS_REMAIN',[]],['OVERSEAS_EXPIRE',[]],
]);
function fail(code:string):never{throw Object.assign(new Error(code),{code});}
function owner(state:SaveState):engine.KboCareer|null{
 const c=state.career as engine.KboCareer|undefined;
 return c&&typeof c.protagonistClubId==='string'&&Array.isArray(c.world?.clubs)?c:null;
}
const posting=(c:engine.KboCareer)=>c.posting?.windows.find(w=>w.seasonKey===c.world.seasonKey);
const overseas=(c:engine.KboCareer)=>c.overseasFa?.windows.find(w=>w.seasonKey===c.world.seasonKey);
const worldDay=(c:engine.KboCareer)=>Math.max(c.days?.days.at(-1)?.day??0,
 ...(c.national?.brackets??[]).filter(b=>b.seasonKey===c.world.seasonKey).map(b=>b.dayReceipts?.at(-1)?.day??0));
const departureEvent=(c:engine.KboCareer)=>c.events.find(e=>e.status==='OPEN'&&e.seasonKey===c.world.seasonKey&&
 ['E62','E63','E64'].includes(e.definitionId)&&e.evidence.fields.playerSimulationKey===c.protagonistKey);

export function kboDepartureBlocksOffseason(c:engine.KboCareer):boolean{
 const status=posting(c)?.status;
 return c.phaseContext.phase==='SEASON_REVIEW'&&(Boolean(departureEvent(c))||status==='REQUESTED'||status==='APPROVED'||overseas(c)?.status==='OPEN');
}
function eligibleOptions(c:engine.KboCareer){
 if(c.phaseContext.phase!=='SEASON_REVIEW'||!c.seasonClose||!c.postseason?.championKey||
  !c.freeAgents||!c.competitionSchedule||!c.days||kboDepartureBlocksOffseason(c))return {posting:false,overseas:false};
 return {
  posting:!c.events.some(e=>e.definitionId==='E62'&&e.seasonKey===c.world.seasonKey)&&engine.kboPostingEligibility(c).eligible,
  overseas:!overseas(c)&&engine.kboOverseasFaEligibility(c).eligible,
 };
}
function command(c:engine.KboCareer,id:string,label:string,name:string,payload:Record<string,unknown>={}):FlowCommand{
 return {id,label,type:prefix+name,payload:{careerRevision:c.revision,...payload}};
}
export function kboDepartureOptions(c:engine.KboCareer):FlowCommand[]{
 const allowed=eligibleOptions(c),out:FlowCommand[]=[];
 if(allowed.posting)out.push(command(c,'posting-invite','포스팅 요청 검토','POSTING_INVITE'));
 if(allowed.overseas)out.push(command(c,'overseas-open','해외 FA 제안 조회','OVERSEAS_OPEN'));
 return out;
}

function activate(state:SaveState,departure:engine.KboCareer):SaveState{
 const roster=engine.createUsRosterWorld({worldKey:departure.world.worldKey,seasonKey:String(Number(departure.world.seasonKey)+1),
  seed:departure.world.seed,difficulty:departure.difficulty,organizations:engine.KBO_US_ORGANIZATIONS});
 const inventory=engine.initialUsRecruitmentInventory(roster,roster.organizations.map(o=>({organizationId:o.id,
  rookieCapacity:o.levels.ROOKIE.length+1,aCapacity:o.levels.A.length+1,availableBudgetUsd:usProAcquisitionBudgetUsd,
  nationalReleaseAllowed:true,militaryReturnOption:true})));
 const career=engine.activateKboUsCareer(departure,departure.revision,roster,inventory);
 return {...state,career,kboDeparture:departure,collegeNationalHost:engine.createKboDepartureHost(departure,career)};
}

export function applyKboDeparture(state:SaveState,body:CommandBody):AppliedCommand{
 const c=owner(state),name=body.type.slice(prefix.length),allowed=commands.get(name),raw=body.payload;
 if(!c)fail('KBO_CAREER_REQUIRED');
 if(!allowed)fail('UNSUPPORTED_COMMAND');
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(key=>key!=='careerRevision'&&!allowed.includes(key)))fail('INVALID_PAYLOAD');
 const p=raw as Record<string,unknown>,rev=p.careerRevision;
 if(typeof rev!=='number'||!Number.isSafeInteger(rev)||rev<1)fail('INVALID_PAYLOAD');
 const readOffer=()=>{
  const key=p.offerKey;
  if(typeof key!=='string'||!key)fail('INVALID_PAYLOAD');
  return key;
 };
 const readEvent=(id:string)=>{
  if(typeof p.eventKey!=='string'||typeof p.eventVersion!=='number'||!Number.isSafeInteger(p.eventVersion)||p.eventVersion<1)fail('INVALID_PAYLOAD');
  const event=departureEvent(c);
  if(!event||event.definitionId!==id||event.eventKey!==p.eventKey||event.version!==p.eventVersion)fail('INVALID_KBO_POSTING_EVENT');
  return {eventKey:event.eventKey,eventVersion:event.version};
 };
 const day=worldDay(c);
 let nextState:SaveState;
 try{
  engine.assertKboCareerRevision(c,rev);
  if(c.phaseContext.phase!=='SEASON_REVIEW')fail('KBO_DEPARTURE_NOT_AVAILABLE');
  let next:engine.KboCareer;
  switch(name){
   case 'POSTING_INVITE':
    if(!eligibleOptions(c).posting)fail('KBO_POSTING_NOT_ELIGIBLE');
    next=engine.openKboPostingInvite(c,rev);break;
   case 'POSTING_REQUEST':
   case 'POSTING_DECLINE':
    next=engine.resolveKboPostingInvite(c,rev,{...readEvent('E62'),command:name==='POSTING_REQUEST'?'REQUEST_POSTING':'ACK_EVENT'});break;
   case 'POSTING_DECIDE':
    next=engine.resolveKboPostingClub(c,rev);break;
   case 'POSTING_ACK_DEFERRED':
    if(posting(c)?.status!=='DEFERRED')fail('KBO_POSTING_DECISION_CHANGED');
    next=engine.resolveKboPostingEvent(c,rev,{...readEvent('E63'),command:'ACK_EVENT'}).career;break;
   case 'POSTING_OPEN_OFFERS':
    readEvent('E63');
    next=engine.openKboPostingOffers(c,rev,day);break;
   case 'POSTING_SIGN':
    next=engine.resolveKboPostingOfferEvent(c,rev,{...readEvent('E64'),command:'ACCEPT_CAREER_OFFER',offerKey:readOffer(),worldDay:day});break;
   case 'POSTING_REMAIN':
    next=engine.resolveKboPostingOfferEvent(c,rev,{...readEvent('E64'),command:'REMAIN_ORIGINAL'});break;
   case 'POSTING_EXPIRE':
    if(day<(posting(c)?.expiresWorldDay??Infinity))fail('KBO_POSTING_OFFER_ACTIVE');
    next=engine.expireOrRejectKboPosting(c,rev,'EXPIRED');break;
   case 'OVERSEAS_OPEN':
    if(!eligibleOptions(c).overseas)fail('KBO_OVERSEAS_FA_NOT_ELIGIBLE');
    next=engine.openKboOverseasFaOffers(c,rev,day);break;
   case 'OVERSEAS_SIGN':
    next=engine.acceptKboOverseasFaOffer(c,rev,readOffer(),day);break;
   case 'OVERSEAS_REMAIN':
    next=engine.expireOrRejectKboOverseasFa(c,rev,'REJECTED');break;
   case 'OVERSEAS_EXPIRE':
    if(day<(overseas(c)?.expiresWorldDay??Infinity))fail('KBO_OVERSEAS_FA_OFFER_ACTIVE');
    next=engine.expireOrRejectKboOverseasFa(c,rev,'EXPIRED');break;
   default:fail('UNSUPPORTED_COMMAND');
  }
  nextState=next.phaseContext.phase==='ARCHIVED'?activate(state,next):{...state,career:next};
 }catch(error){
  if(error&&typeof error==='object'&&'code' in error)throw error;
  fail(error instanceof Error&&/^[A-Z][A-Z0-9_]*$/.test(error.message)?error.message:'INVALID_REQUEST');
 }
 const next=nextState.career as engine.KboCareer|engine.UsCareer;
 return {nextState,phase:next.phaseContext.phase,eventIds:next.events.slice(c.events.length).map(e=>e.definitionId),summary:{type:body.type,careerRevision:next.revision}};
}

const dollars=(amount:number)=>'$'+amount.toLocaleString('en-US');
export function kboDepartureFlow(state:SaveState):FlowScreen|null{
 const c=owner(state);
 if(!c||!kboDepartureBlocksOffseason(c))return null;
 const player=c.world.players[c.protagonistKey],event=departureEvent(c),postingWindow=posting(c),overseasWindow=overseas(c);
 const lines=[{label:'시즌',value:c.world.seasonKey}];
 const out=(title:string,choices:FlowCommand[],notice:string|null=null):FlowScreen=>
  ({screenId:'CAREER_FLOW',title,lines,commands:choices,notice,careerRevision:c.revision});
 const cmd=(id:string,label:string,name:string,payload:Record<string,unknown>={})=>command(c,id,label,name,payload);
 const eventPayload=event?{eventKey:event.eventKey,eventVersion:event.version}:{};
 if(event?.definitionId==='E62'){
  const service=engine.kboServiceTimeView(c).registrationThresholds.posting;
  lines.push({label:'포스팅 자격',value:service.reached?'등록 시즌 및 병역 조건 충족':'자격 미달'});
  return out('포스팅 검토',[cmd('posting-request','구단에 승인 요청','POSTING_REQUEST',eventPayload),cmd('posting-stay','원구단 잔류','POSTING_DECLINE',eventPayload)]);
 }
 if(postingWindow?.status==='REQUESTED')return out('포스팅 신청',[cmd('posting-decide','구단 결정 확인','POSTING_DECIDE')]);
 if(event?.definitionId==='E63'){
  if(postingWindow?.approvalScore!==undefined)lines.push({label:'구단 평가',value:postingWindow.approvalScore.toFixed(1)});
  if(postingWindow?.status==='DEFERRED')return out('포스팅 보류',[cmd('posting-ack','확인하고 계속','POSTING_ACK_DEFERRED',eventPayload)],'현재 계약으로 원구단에 남습니다.');
  return out('포스팅 승인',[cmd('posting-offers','미국 제안 조회','POSTING_OPEN_OFFERS',eventPayload)]);
 }
 const isPosting=postingWindow?.status==='APPROVED',market=isPosting?postingWindow:overseasWindow;
 if(!market||!player)return null;
 const type=isPosting?'POSTING':'OVERSEAS',title=isPosting?'포스팅 제안 비교':'해외 FA 제안 비교',day=worldDay(c);
 if(market.expiresWorldDay!==undefined){
  if(day>=market.expiresWorldDay)return out(title,[cmd('departure-expire','협상 마감 확인',type+'_EXPIRE')],'제안 기한이 끝났습니다.');
  lines.push({label:'협상 기한',value:(market.expiresWorldDay-day)+'게임일 남음'});
 }
 const offers=market.offers??[];
 const choices=offers.map(offer=>({
  ...cmd('departure-sign-'+offer.organizationId,offer.organizationName+' 계약',type+'_SIGN',{...eventPayload,offerKey:offer.offerKey}),
  confirm:'이 계약을 체결하고 미국으로 이적할까요?',sign:{name:player.name},
  facts:[
   {label:'시작 리그',value:offer.initialLevel},{label:'계약 기간',value:offer.years+'년'},
   {label:'연봉',value:dollars(offer.annualSalaryUsd)},{label:'총보장',value:dollars(offer.annualSalaryUsd*offer.years)},
   {label:'계약금',value:'$0'},{label:'대표 차출',value:offer.nationalReleaseAllowed?'허용':'제한'},
   {label:'병역 복귀 옵션',value:offer.militaryReturnOption?'포함':'미포함'},
   {label:'국내 복귀 보유권',value:isPosting?'원구단':'해제'},
  ],
 }));
 return out(title,[...choices,cmd('departure-remain','원구단 계약 유지',type+'_REMAIN',eventPayload)],offers.length?null:'조건에 맞는 제안이 없습니다.');
}
