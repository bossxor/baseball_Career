import {collegeMilitaryServiceView} from './college-service.js';
import {kboPostingFeeWon} from './kbo-posting.js';
import type {HighSchoolCareer} from './high-school-career.js';
import type {KboCareer} from './kbo-career-entry.js';
import type {UsCareer} from './us-career-entry.js';
import {canonicalJson} from './game.js';
import {recordTotals} from './records.js';
import {assertNationalLedger} from './kbo-national.js';
import type {GameContribution} from './records.js';
import {assertKboDraft} from './kbo-draft.js';
import {assertUsDirect} from './us-direct.js';
import {createWorldEvent,eventDefinition,validateEvent} from './events.js';
import type {EventInstance} from './events.js';

export const CAREER_ACHIEVEMENT_DEFINITIONS={
 A01:{condition:'프로 첫 계약 실제 체결(KBO/MiLB/MLB)',rewardType:'STAMP'},
 A02:{condition:'KBO 첫 실제 출장',rewardType:'STAMP'},
 A03:{condition:'MLB 첫 실제 출장',rewardType:'STAMP'},
 A04:{condition:'국제대회 첫 실제 출장',rewardType:'STAMP'},
 A05:{condition:'대학 졸업 확정(GRADUATED)',rewardType:'STAMP'},
 A06:{condition:'포스팅 후 해외 계약 실제 체결',rewardType:'STAMP'},
 A07:{condition:'실제 병역 완료(COMPLETED), 비대상 제외',rewardType:'STAMP'},
 A08:{condition:'동일 리그 커리어 정규시즌 1000안타',rewardType:'STAMP'},
 A09:{condition:'동일 리그 커리어 정규시즌 100승',rewardType:'STAMP'},
 A10:{condition:'동일 리그 커리어 정규시즌 200세이브',rewardType:'STAMP'},
 A11:{condition:'고교 라이벌과 첫 실제 재회',rewardType:'STAMP'},
 A12:{condition:'KBO와 MLB 실제 출장 후 은퇴',rewardType:'COVER'},
} as const;
export type CareerAchievementId=keyof typeof CAREER_ACHIEVEMENT_DEFINITIONS;
export interface CareerAchievementEvidence {sourceKey:string;seasonKey:string;leagueKey:string|null;worldDay:number}
export interface CareerAchievementUnlock {achievementId:CareerAchievementId;definitionVersion:1;receiptKey:string;evidence:CareerAchievementEvidence;status:'COMPLETED'|'CORRECTED';corrections:readonly {recordRevision:number;seasonKey:string}[]}
export interface CareerAchievementLedger {
 schemaVersion:1;worldKey:string;playerKey:string;unlocks:CareerAchievementUnlock[];
 rewards:{rewardId:string;type:'STAMP'|'COVER';firstReceipt:string;sources:string[]}[];
 notices:EventInstance[];
}
export type AchievementCareer=(HighSchoolCareer|KboCareer|UsCareer)&{achievements?:CareerAchievementLedger};
const keyOf=(c:AchievementCareer)=>'protagonistKey'in c?c.protagonistKey:c.world.protagonistKey;
const schoolOf=(c:AchievementCareer):HighSchoolCareer=>'amateurHistory'in c?c.amateurHistory:c;
const receipt=(c:AchievementCareer,id:CareerAchievementId,e:CareerAchievementEvidence)=>JSON.stringify(['career-achievement-1',c.world.worldKey,keyOf(c),id,canonicalJson(e)]);
const played=(g:GameContribution,key:string)=>(g.batting[key]?.PA??0)>0||(g.pitching[key]?.BF??0)>0;
const evidence=(sourceKey:string,seasonKey:string,leagueKey:string|null,worldDay:number):CareerAchievementEvidence=>({sourceKey,seasonKey,leagueKey,worldDay});
const gameEvidence=(g:GameContribution)=>evidence(g.gameKey,g.scope.seasonKey,g.scope.leagueKey,g.worldDay);
const gameOrder=(a:GameContribution,b:GameContribution)=>a.scope.seasonKey.localeCompare(b.scope.seasonKey)||a.worldDay-b.worldDay||a.gameKey.localeCompare(b.gameKey);
function candidates(c:AchievementCareer):Partial<Record<CareerAchievementId,CareerAchievementEvidence>> {
 const result:Partial<Record<CareerAchievementId,CareerAchievementEvidence>>={},key=keyOf(c),school=schoolOf(c),games=Object.values(c.records.games).filter(g=>Object.hasOwn(g.batting,key)||Object.hasOwn(g.pitching,key));
 const first:Partial<Record<'A02'|'A03',GameContribution>>={};
 for(const g of games)if(played(g,key)&&['REGULAR','POSTSEASON'].includes(g.scope.phase)){
  const id=g.scope.leagueKey==='KBO'?'A02':g.scope.leagueKey==='MLB'?'A03':null;if(id&&(!first[id]||gameOrder(g,first[id]!)<0)){first[id]=g;result[id]=gameEvidence(g);}
 }
 const international=games.filter(g=>g.scope.phase==='INTERNATIONAL'&&['WBC','AG','OLY','P12'].includes(g.scope.leagueKey)&&played(g,key)).sort(gameOrder)[0];if(international)result.A04=gameEvidence(international);
 const posting='posting'in c?c.posting?.windows.find(w=>w.status==='SIGNED'&&w.signedOfferKey):undefined,transfer='kboTransfer'in c&&c.kboTransfer?.source==='POSTING'?c.kboTransfer:undefined;
 const postingId=posting?.postingId??transfer?.postingId,offer=posting?.offers?.find(o=>o.offerKey===posting.signedOfferKey)??transfer?.offer;
 if(postingId&&offer){const accepted=c.events.find(e=>e.definitionId==='E64'&&e.worldKey===c.world.worldKey&&e.evidence.fields.playerSimulationKey===key&&e.evidence.fields.postingWindowId===postingId&&e.status==='RESOLVED'&&e.resolution?.command==='ACCEPT_CAREER_OFFER'&&e.resolution.receiptKey===JSON.stringify(['kbo-posting-accept',postingId,offer.offerKey]));
  if(accepted&&(!posting||posting.compensationWon===kboPostingFeeWon(offer))){validateEvent(accepted);result.A06=evidence(accepted.resolution!.receiptKey!,accepted.seasonKey,null,accepted.occurredWorldDay);}}
 const collegeService=school.collegeService;if(collegeService&&['COMPLETED','RESUMED'].includes(collegeService.status)&&collegeService.completedBlocks===2){collegeMilitaryServiceView(school);const done=collegeService.completionDays[1]!;result.A07=evidence(JSON.stringify(['college-service-complete',collegeService.programId]),done.seasonKey,null,done.worldDay);}
 const national=c.national,athleteStatus='protagonistKey'in c?c.military?.status:c.national?.militaryStatus;
 if(athleteStatus==='COMPLETED'&&national?.athleteDutySeasonsRemaining===0){
  assertNationalLedger(national,c.world.worldKey);const start=national.athleteDutyStartSeasonKey,settled=national.athleteDutySettledSeasons;
  if(start&&settled?.length===3&&settled.every((year,i)=>year===String(Number(start)+i))&&Number(settled[2])<=Number(c.world.seasonKey)&&national.benefits.some(b=>national.competitions.some(r=>r.competitionId===b.competitionId&&Number(r.seasonKey)<Number(start)))){
   const seasonKey=settled[2]!,day=Object.values(c.records.games).reduce((n,g)=>g.scope.seasonKey===seasonKey?Math.max(n,g.worldDay):n,0);result.A07=evidence(JSON.stringify(['athlete-duty-complete',c.world.worldKey,key,start,settled]),seasonKey,null,day);
  }
 }
 const kr=school.kboRecruitment,ks=kr?.program.signing,ur=school.usRecruitment,us=ur?.program.signing;
 if(kr?.program.decision==='SIGNED'&&ks){
  assertKboDraft(kr.world,kr.program);
  if(kr.world.worldKey!==c.world.worldKey||ks.contract.playerKey!==key||ks.contract.contractKey!==ks.receiptKey)throw new RangeError('INVALID_ACHIEVEMENT_SIGNING');
  result.A01=evidence(ks.receiptKey,ks.contract.seasonKey,'KBO',0);
 }else if(ur?.program.decision==='SIGNED'&&us){
  assertUsDirect(ur.world,ur.program);
  if(ur.world.worldKey!==c.world.worldKey||us.playerKey!==key||us.contract.contractKey!==us.receiptKey)throw new RangeError('INVALID_ACHIEVEMENT_SIGNING');
  result.A01=evidence(us.receiptKey,us.seasonKey,us.registration.level,us.signedWorldDay);
 }
 const admission=school.collegeAdmission,degree=school.collegeGraduation,graduated=degree?school.events.find(e=>e.eventKey===degree.eventKey):undefined;
 if(admission?.status==='GRADUATED'&&admission.playerKey===key&&admission.academicYear===4&&admission.yearsCompleted===4&&degree&&graduated?.definitionId==='E75'&&graduated.status==='RESOLVED'&&graduated.resolution?.command==='GRADUATE_COLLEGE'&&graduated.resolution.receiptKey===degree.receiptKey){
  validateEvent(graduated);const expected=JSON.stringify(['college-graduation',school.world.worldKey,school.world.seasonKey,admission.admissionKey,key]);
  if(degree.receiptKey!==expected||graduated.evidence.fields.playerSimulationKey!==key||graduated.evidence.fields.enrollmentId!==admission.admissionKey)throw new RangeError('INVALID_ACHIEVEMENT_GRADUATION');
  result.A05=evidence(degree.receiptKey,school.world.seasonKey,'COLLEGE',graduated.occurredWorldDay);
 }
 if('protagonistClubId'in c){const m=c.military,p=m?.program,last=p?.blocks.at(-1);
  if(m?.status==='COMPLETED'&&p&&p.playerKey===key&&p.scheduledBlocks===2&&p.completedBlocks===2&&p.blocks.length===2&&p.blocks.every(b=>Number.isSafeInteger(b.completedWorldDay)&&b.completedWorldDay!==null&&b.completedWorldDay>=0)&&last&&m.completedSeasonKey===last.seasonKey&&p.returnOptionId===JSON.stringify([p.kind==='SPORTS'?'sangmu-return':'active-return',p.programId])){
   const expected=JSON.stringify([p.kind==='SPORTS'?'sangmu-program':'active-program',c.world.worldKey,String(Number(p.startedSeason)-1),key]);
   if(p.programId!==expected||p.blocks[0]!.seasonKey!==p.startedSeason||Number(last.seasonKey)!==Number(p.startedSeason)+1)throw new RangeError('INVALID_ACHIEVEMENT_SERVICE');
   result.A07=evidence(p.returnOptionId,last.seasonKey,null,last.completedWorldDay!);
  }
 }
 // Only this player's official rows can change career milestones; keep the shared validated integer aggregation.
 const ownRecords={revision:c.records.revision,games:Object.fromEntries(games.filter(g=>g.scope.phase==='REGULAR').map(g=>[g.gameKey,{...g,teams:{},matchups:{},batting:Object.hasOwn(g.batting,key)?{[key]:g.batting[key]!}:{},pitching:Object.hasOwn(g.pitching,key)?{[key]:g.pitching[key]!}:{},batterSplits:Object.hasOwn(g.batting,key)?{[key]:g.batterSplits[key]!}:{},pitcherSplits:Object.hasOwn(g.pitching,key)?{[key]:g.pitcherSplits[key]!}:{}}]))};
 for(const league of [...new Set(games.filter(g=>g.scope.phase==='REGULAR').map(g=>g.scope.leagueKey))].sort()){
  const t=recordTotals(ownRecords,{leagueKey:league,phase:'REGULAR'}),b=t.batting[key],p=t.pitching[key];
  for(const [id,value,target]of [['A08',b?.H??0,1000],['A09',p?.W??0,100],['A10',p?.SV??0,200]] as const){
   if(value<target||result[id])continue;
   const prior=c.achievements?.unlocks.find(u=>u.achievementId===id);if(prior){result[id]=prior.evidence;continue;}
   const rows=games.filter(g=>g.scope.leagueKey===league&&g.scope.phase==='REGULAR'&&(id==='A08'?(g.batting[key]?.H??0)>0:id==='A09'?(g.pitching[key]?.W??0)>0:(g.pitching[key]?.SV??0)>0)).sort(gameOrder),last=rows.at(-1)!;
   result[id]=evidence(JSON.stringify(['career-record',league,id,rows.map(g=>g.gameKey)]),last.scope.seasonKey,league,last.worldDay);
  }
 }
 const hsRivals=new Set(school.relationships?.relations.filter(r=>r.type==='RIVAL'&&r.primaryPlayerKey===key&&r.milestones.some(m=>m.stage==='FORMED'&&m.evidenceKey===JSON.stringify(['hs-formation',c.world.worldKey,'RIVAL']))).map(r=>r.relationKey));
 for(const n of c.relationNotices??[]){
  if(!['E95','E96'].includes(n.definitionId)||!hsRivals.has(String(n.evidence.fields.relationId)))continue;validateEvent(n);
  const r=c.relationships?.relations.find(r=>r.relationKey===n.evidence.fields.relationId),stage=r?.milestones.find(m=>m.evidenceKey===n.evidenceKey&&['REUNITED_OPPONENT','REUNITED_TEAM'].includes(m.stage));if(!r||!stage||n.worldKey!==c.world.worldKey||stage.worldDay!==n.occurredWorldDay)continue;
  const g=games.filter(g=>g.scope.seasonKey===n.seasonKey&&g.worldDay===n.occurredWorldDay&&played(g,key)&&played(g,r.otherPlayerKey)&&(n.definitionId!=='E95'||g.gameKey===n.evidence.fields.actualMeetingGameId)).sort(gameOrder)[0];
  if(g&&!result.A11){
   const rows=c.health.games.filter(h=>h.evidence.gameKey===g.gameKey&&h.evidence.seasonKey===g.scope.seasonKey&&h.evidence.day===g.worldDay).map(h=>h.evidence),side=(player:string)=>rows.filter(h=>h.roster.includes(player)&&h.appearances.some(a=>a.playerKey===player));
   const own=side(key),other=side(r.otherPlayerKey);if(own.length!==1||other.length!==1||!Object.hasOwn(g.teams,own[0]!.teamKey.slice(g.scope.leagueKey.length+1))||!Object.hasOwn(g.teams,other[0]!.teamKey.slice(g.scope.leagueKey.length+1)))continue;
   if((n.definitionId==='E95')===(own[0]!.teamKey===other[0]!.teamKey))continue;
   if(n.definitionId==='E95'&&!r.milestones.some(m=>m.stage==='SEPARATED'&&m.evidenceKey===n.evidence.fields.stageEvidenceId))continue;
   result.A11=evidence(n.eventKey,g.scope.seasonKey,g.scope.leagueKey,g.worldDay);
  }
 }
 if('retirement'in c&&c.phaseContext.phase==='ARCHIVED'&&c.retirement&&result.A02&&result.A03){
  const r=c.retirement,prefix='protagonistClubId'in c?'kbo-retirement':'us-retirement';
  if(r.receiptKey!==JSON.stringify([prefix,c.world.worldKey,c.world.seasonKey,key])||r.seasonKey!==c.world.seasonKey||r.sourceRevision>c.revision)throw new RangeError('INVALID_ACHIEVEMENT_RETIREMENT');
  result.A12=evidence(r.receiptKey,r.seasonKey,null,Math.max(0,...games.filter(g=>g.scope.seasonKey===r.seasonKey).map(g=>g.worldDay)));
 }
 return result;
}
function validate(c:AchievementCareer):void {
 const l=c.achievements;if(!l)return;
 if(l.schemaVersion!==1||l.worldKey!==c.world.worldKey||l.playerKey!==keyOf(c)||!Array.isArray(l.unlocks)||!Array.isArray(l.rewards)||!Array.isArray(l.notices))throw new RangeError('INVALID_ACHIEVEMENT_LEDGER');
 if(new Set(l.unlocks.map(u=>u.achievementId)).size!==l.unlocks.length||new Set(l.rewards.map(r=>r.rewardId)).size!==l.rewards.length||new Set(l.notices.map(n=>n.eventKey)).size!==l.notices.length)throw new RangeError('DUPLICATE_ACHIEVEMENT');
 for(const u of l.unlocks){
  if(!u||!Object.hasOwn(CAREER_ACHIEVEMENT_DEFINITIONS,u.achievementId)||u.definitionVersion!==1||!u.evidence||!u.evidence.sourceKey||!u.evidence.seasonKey||!Number.isSafeInteger(u.evidence.worldDay)||u.evidence.worldDay<0||u.receiptKey!==receipt(c,u.achievementId,u.evidence)||!['COMPLETED','CORRECTED'].includes(u.status)||!Array.isArray(u.corrections)||u.corrections.length!==Number(u.status==='CORRECTED')||u.corrections.some(r=>!Number.isSafeInteger(r.recordRevision)||r.recordRevision<0||!r.seasonKey))throw new RangeError('INVALID_ACHIEVEMENT_UNLOCK');
  const reward=l.rewards.find(r=>r.rewardId==='R-'+u.achievementId);if(!reward||reward.type!==CAREER_ACHIEVEMENT_DEFINITIONS[u.achievementId].rewardType||reward.firstReceipt!==u.receiptKey||!Array.isArray(reward.sources)||canonicalJson(reward.sources)!==canonicalJson([u.receiptKey]))throw new RangeError('INVALID_ACHIEVEMENT_REWARD');
 }
 if(l.rewards.length!==l.unlocks.length)throw new RangeError('INVALID_ACHIEVEMENT_REWARD');
 for(const n of l.notices){validateEvent(n);const u=l.unlocks.find(u=>u.achievementId===n.evidence.fields.goalId);if(n.definitionId!=='E90'||n.worldKey!==l.worldKey||n.evidence.fields.playerSimulationKey!==l.playerKey||!u||!['COMPLETED','CORRECTED'].includes(String(n.evidence.fields.stage)))throw new RangeError('INVALID_ACHIEVEMENT_NOTICE');}
 for(const u of l.unlocks)if(l.notices.filter(n=>n.evidence.fields.goalId===u.achievementId).length!==1+u.corrections.length)throw new RangeError('INVALID_ACHIEVEMENT_NOTICE');
}
/** Caller has committed official records/state and owns the surrounding revision transaction. */
export function refreshCareerAchievements<T extends AchievementCareer>(c:T):T {
 validate(c);const eligible=candidates(c),ids=Object.keys(CAREER_ACHIEVEMENT_DEFINITIONS)as CareerAchievementId[];
 if(!ids.some(id=>{const old=c.achievements?.unlocks.find(u=>u.achievementId===id);return !old?!!eligible[id]:old.status==='COMPLETED'&&!eligible[id];}))return c;
 const l=structuredClone(c.achievements??{schemaVersion:1 as const,worldKey:c.world.worldKey,playerKey:keyOf(c),unlocks:[],rewards:[],notices:[]});let changed=false;
 for(const id of Object.keys(CAREER_ACHIEVEMENT_DEFINITIONS)as CareerAchievementId[]){const old=l.unlocks.find(u=>u.achievementId===id),e=eligible[id];let stage:'COMPLETED'|'CORRECTED'|null=null;
  if(!old&&e){const r=receipt(c,id,e);l.unlocks.push({achievementId:id,definitionVersion:1,receiptKey:r,evidence:e,status:'COMPLETED',corrections:[]});l.rewards.push({rewardId:'R-'+id,type:CAREER_ACHIEVEMENT_DEFINITIONS[id].rewardType,firstReceipt:r,sources:[r]});stage='COMPLETED';}
  else if(old?.status==='COMPLETED'&&!e){old.status='CORRECTED';old.corrections=[{recordRevision:c.records.revision,seasonKey:c.world.seasonKey}];stage='CORRECTED';}
  if(stage){changed=true;const d=eventDefinition('E90'),source=e??old!.evidence,seasonKey=stage==='CORRECTED'?c.world.seasonKey:source.seasonKey;l.notices.push(createWorldEvent({definitionId:'E90',worldKey:l.worldKey,seasonKey,evidence:{version:1,type:d.evidenceDomain,fields:{playerSimulationKey:l.playerKey,worldSeasonId:seasonKey,goalId:id,stage}},resume:{worldKey:l.worldKey,seasonKey,phase:'SEASON_REVIEW',competitionKey:source.leagueKey,registrationKey:null,sourceRevision:c.revision},sourceSequence:l.notices.length+1,worldDay:source.worldDay}));}
 }
 return changed?{...c,achievements:l}:c;
}
export function careerAchievementsView(c:AchievementCareer){
 validate(c);return {playerKey:keyOf(c),sourceDifficulty:c.difficulty,gameplayRewardDelta:0 as const,noticeDelivery:'OUTBOX' as const,
  achievements:(Object.keys(CAREER_ACHIEVEMENT_DEFINITIONS)as CareerAchievementId[]).map(id=>{const u=c.achievements?.unlocks.find(u=>u.achievementId===id);return {achievementId:id,...CAREER_ACHIEVEMENT_DEFINITIONS[id],rewardId:'R-'+id,status:u?.status??'LOCKED' as const,unavailableReason:null};}),
  rewards:structuredClone(c.achievements?.rewards??[]),notices:(c.achievements?.notices??[]).map(n=>({eventKey:n.eventKey,version:n.version,status:n.status,achievementId:n.evidence.fields.goalId,stage:n.evidence.fields.stage,title:eventDefinition(n.definitionId).title}))};
}
