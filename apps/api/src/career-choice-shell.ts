import {
  chooseCollegeAdmissionFocus, careerRouteNoticesView, resolveCareerRouteNotice,
  collegeEarlyUsComparisonView, openCollegeEarlyUsOffer, decideCareerUsDirect, assertCollegeUnsignedReturn, returnUnsignedCollegeCareer,
  unreadProTraitSummary, acknowledgeProTraitSummary,
} from '@playball/engine';
import type {HighSchoolCareer, KboCareer, UsCareer} from '@playball/engine';
import type {AppliedCommand, CommandBody, SaveState} from './engine-command.js';

export const CAREER_CHOICE_SCREEN_IDS = ['CAREER_ROUTE_NOTICES', 'COLLEGE_US_COMPARISON', 'PRO_TRAIT_SUMMARY', 'COLLEGE_UNSIGNED_RETURN'] as const;
type Career = HighSchoolCareer | KboCareer | UsCareer;
const FIELDS = new Map<string,readonly string[]>([
  ['CAREER_CHOICE_COLLEGE_FOCUS',['careerRevision','eventKey','eventVersion','focus']],
  ['CAREER_CHOICE_COLLEGE_OPEN_US',['careerRevision','eventVersion']],
  ['CAREER_CHOICE_COLLEGE_SIGN_US',['careerRevision','eventVersion','programVersion','offerKey']],
  ['CAREER_CHOICE_PRO_ACK_TRAITS',['careerRevision']],
  ['CAREER_CHOICE_COLLEGE_RETURN',['careerRevision','eventVersion']],
  ['CAREER_CHOICE_ACK_ROUTE_NOTICE',['careerRevision','eventKey','eventVersion']],
]);
function fail(code:string):never {throw Object.assign(new Error(code),{code});}
function source(state:SaveState):Career {
  if(!state.career || typeof state.career!=='object' || Array.isArray(state.career))fail('CAREER_NOT_FOUND');
  return state.career as Career;
}
function domainError(err:unknown):never {
  fail(err instanceof Error && /^[A-Z][A-Z0-9_]*$/.test(err.message)?err.message:'INVALID_REQUEST');
}
function number(p:Record<string,unknown>,key:string):number {
  const value=p[key];if(typeof value!=='number'||!Number.isSafeInteger(value)||value<1)fail('INVALID_PAYLOAD');return value;
}
/** Only choice identifiers cross HTTP; the persisted engine owner supplies all authority. */
export function applyCareerChoice(state:SaveState,command:CommandBody):AppliedCommand {
  const career=source(state),raw=command.payload;
  if(!raw || typeof raw!=='object' || Array.isArray(raw))fail('INVALID_PAYLOAD');
  const p=raw as Record<string,unknown>,fields=FIELDS.get(command.type);
  if(!fields)fail('UNSUPPORTED_COMMAND');
  if(Object.keys(p).some(key=>!fields.includes(key)))fail('INVALID_PAYLOAD');
  const revision=number(p,'careerRevision');let nextCareer:Career=career,navigation:ReturnType<typeof openCollegeEarlyUsOffer>['navigation']|undefined=undefined;
  try {
    if(command.type==='CAREER_CHOICE_COLLEGE_FOCUS'){
      if(typeof p.eventKey!=='string'||!Array.isArray(p.focus)||!p.focus.every((v):v is string=>typeof v==='string'))fail('INVALID_PAYLOAD');
      nextCareer=chooseCollegeAdmissionFocus(career as HighSchoolCareer,revision,{eventKey:p.eventKey,eventVersion:number(p,'eventVersion'),focus:p.focus});
    }else if(command.type==='CAREER_CHOICE_COLLEGE_OPEN_US'){
      const result=openCollegeEarlyUsOffer(career as HighSchoolCareer,revision,number(p,'eventVersion'));nextCareer=result.career;navigation=result.navigation;
      if(navigation?.targetScreen!=='S29')fail('INVALID_NAVIGATION');
    }else if(command.type==='CAREER_CHOICE_COLLEGE_SIGN_US'){
      if(typeof p.offerKey!=='string')fail('INVALID_PAYLOAD');
      collegeEarlyUsComparisonView(career as HighSchoolCareer);
      nextCareer=decideCareerUsDirect(career as HighSchoolCareer,revision,{eventVersion:number(p,'eventVersion'),programVersion:number(p,'programVersion'),decision:{type:'SIGN',offerKey:p.offerKey}});
    }else if(command.type==='CAREER_CHOICE_ACK_ROUTE_NOTICE'){
      if(typeof p.eventKey!=='string')fail('INVALID_PAYLOAD');
      nextCareer=resolveCareerRouteNotice(career as HighSchoolCareer,revision,{eventKey:p.eventKey,eventVersion:number(p,'eventVersion'),command:'ACK_EVENT'}).career;
    }else if(command.type==='CAREER_CHOICE_COLLEGE_RETURN')nextCareer=returnUnsignedCollegeCareer(career as HighSchoolCareer,revision,number(p,'eventVersion'));
    else nextCareer=acknowledgeProTraitSummary(career as KboCareer|UsCareer,revision);
  }catch(err){domainError(err);}
  return {
    nextState:{...state,career:nextCareer},phase:nextCareer.phaseContext.phase,eventIds:[],
    summary:{type:command.type,careerRevision:nextCareer.revision,...(navigation?{navigation}:{})},
    ...(navigation?{next:{kind:'screen' as const,screenId:'S29' as const}}:{}),
  };
}
export function careerChoiceScreen(state:SaveState,screenId:string):unknown {
  const career=source(state);
  try {
    if(screenId==='CAREER_ROUTE_NOTICES')return {...careerRouteNoticesView(career as HighSchoolCareer),careerRevision:career.revision};
    if(screenId==='COLLEGE_US_COMPARISON')return {...collegeEarlyUsComparisonView(career as HighSchoolCareer),careerRevision:career.revision};
    if(screenId==='COLLEGE_UNSIGNED_RETURN'){
      const event=assertCollegeUnsignedReturn(career as HighSchoolCareer);
      return {careerRevision:career.revision,eventKey:event.eventKey,eventVersion:event.version,commands:[...event.offeredChoices]};
    }
    if(screenId==='PRO_TRAIT_SUMMARY')return {unlocks:unreadProTraitSummary(career as KboCareer|UsCareer),careerRevision:career.revision};
    fail('INVALID_REQUEST');
  }catch(err){domainError(err);}
}
