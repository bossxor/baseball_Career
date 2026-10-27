import type {HighSchoolCareer} from './high-school-career.js';
import {assertCareerRevision} from './high-school-career.js';
import type {KboCareer} from './kbo-career-entry.js';
import {assertKboCareerRevision} from './kbo-career-version.js';
import type {UsCareer} from './us-career-entry.js';
import {assertUsCareerRevision} from './us-career-entry.js';
import {US_SEASON_GAMES} from './us-schedule.js';
import {recordTotals} from './records.js';
import type {RecordScope} from './records.js';
import {canonicalJson} from './game.js';
import {createWorldEvent,eventDefinition,validateEvent} from './events.js';
import type {EventInstance} from './events.js';

export type GoalCareer=HighSchoolCareer|KboCareer|UsCareer;
export const SEASON_GOAL_DEFINITIONS={
 G01:{title:"첫50타석",unit:"PA",kind:'HITTER',target:50,rewardType:'FRAME'},G02:{title:"선발50경기",unit:"STARTS",kind:'HITTER',target:50,rewardType:'TITLE'},G03:{title:"한시즌20홈런",unit:"HR",kind:'HITTER',target:20,rewardType:'BACKGROUND'},G04:{title:"한시즌30볼넷",unit:"BB",kind:'HITTER',target:30,rewardType:'STAMP'},
 G05:{title:"한시즌100탈삼진",unit:"K",kind:'PITCHER',target:100,rewardType:'BACKGROUND'},G06:{title:"선발100이닝",unit:"OUTS",kind:'PITCHER',target:300,rewardType:'FRAME'},G07:{title:"한시즌20세이브",unit:"SV",kind:'PITCHER',target:20,rewardType:'TITLE'},
 G08:{title:"부상에서복귀",unit:"EVENT",kind:'BOTH',target:1,rewardType:'BACKGROUND'},G09:{title:"팀포스트시즌진출",unit:"EVENT",kind:'BOTH',target:1,rewardType:'STAMP'},G10:{title:"대학선수권첫출장",unit:"EVENT",kind:'BOTH',target:1,rewardType:'FRAME'},
} as const;
export type SeasonGoalId=keyof typeof SEASON_GOAL_DEFINITIONS;
export interface SeasonGoalSlot {slot:number;goalId:SeasonGoalId;scope:RecordScope;teamKey:string;status:'ACTIVE'|'COMPLETED'|'REPLACED'|'EXPIRED'|'CORRECTED';progress:number;selectedRevision:number;injuryGameKey?:string;completionReceipt?:string}
export interface SeasonGoals {leagueKey:string;teamKey:string;scheduledGames:number;replacementUsed:boolean;slots:SeasonGoalSlot[];history:SeasonGoalSlot[]}
export interface CareerGoalLedger {schemaVersion:1;worldKey:string;playerKey:string;seasons:Record<string,SeasonGoals>;notices:readonly EventInstance[];rewards:readonly {rewardId:string;type:typeof SEASON_GOAL_DEFINITIONS[SeasonGoalId]['rewardType'];firstReceipt:string;sources:readonly string[]}[]}
const isUs=(c:GoalCareer):c is UsCareer=>'mode'in c&&c.mode==='US_CAREER';
const isKbo=(c:GoalCareer):c is KboCareer=>'protagonistClubId'in c;
function registration(c:GoalCareer){
 if(isUs(c))return {key:c.protagonistKey,team:c.protagonistOrganizationId,league:c.registration.level,games:US_SEASON_GAMES[c.registration.level]};
 if(isKbo(c))return {key:c.protagonistKey,team:c.protagonistClubId,league:c.registration.competitionKey??(c.registration.firstTeam?'KBO':'FUTURES'),games:144};
 return {key:c.world.protagonistKey,team:c.world.protagonistSchoolId,league:c.world.leagueKey??'HS',games:c.world.schedule.filter(g=>g.homeTeamKey===c.world.protagonistSchoolId||g.awayTeamKey===c.world.protagonistSchoolId).length};
}
function assertRevision(c:GoalCareer,revision:number){if(isUs(c))assertUsCareerRevision(c,revision);else if(isKbo(c))assertKboCareerRevision(c,revision);else assertCareerRevision(c,revision);}
function empty(c:GoalCareer):CareerGoalLedger {return {schemaVersion:1,worldKey:c.world.worldKey,playerKey:registration(c).key,seasons:{},notices:[],rewards:[]};}
function validate(c:GoalCareer):void {
 const l=c.goals;if(!l)return;
 if(!Array.isArray(l.rewards)||!Array.isArray(l.notices)||!l.seasons||typeof l.seasons!=='object'||Array.isArray(l.seasons)||l.rewards.some(r=>!r||typeof r.rewardId!=='string'||!Array.isArray(r.sources)))throw new RangeError('INVALID_GOAL_LEDGER');
 if(l.schemaVersion!==1||l.worldKey!==c.world.worldKey||l.playerKey!==registration(c).key||new Set(l.rewards.map(r=>r.rewardId)).size!==l.rewards.length)throw new RangeError('INVALID_GOAL_LEDGER');
 if(new Set(l.notices.map(n=>n.eventKey)).size!==l.notices.length)throw new RangeError('INVALID_GOAL_NOTICES');for(const n of l.notices){validateEvent(n);if(n.definitionId!=='E90'||n.worldKey!==l.worldKey||n.evidence.fields.playerSimulationKey!==l.playerKey)throw new RangeError('INVALID_GOAL_NOTICES');}
 for(const [year,s]of Object.entries(l.seasons)){
  if(!s||!Array.isArray(s.slots)||!Array.isArray(s.history)||!year||!s.leagueKey||!s.teamKey||!Number.isSafeInteger(s.scheduledGames)||s.scheduledGames<1||typeof s.replacementUsed!=='boolean'||s.slots.length>3||new Set(s.slots.map(g=>g.slot)).size!==s.slots.length||new Set(s.slots.map(g=>g.goalId)).size!==s.slots.length)throw new RangeError('INVALID_GOAL_LEDGER');
  for(const g of [...s.slots,...s.history])if(!g||!g.scope||!Object.hasOwn(SEASON_GOAL_DEFINITIONS,g.goalId)||!Number.isSafeInteger(g.slot)||g.slot<0||g.slot>2||g.scope.seasonKey!==year||g.scope.phase!==(g.goalId==='G10'?'POSTSEASON':'REGULAR')||!['HS','COLLEGE','KBO','FUTURES','ROOKIE','A','AA','AAA','MLB'].includes(g.scope.leagueKey)||!['ACTIVE','COMPLETED','REPLACED','EXPIRED','CORRECTED'].includes(g.status)||!Number.isSafeInteger(g.progress)||g.progress<0||!Number.isSafeInteger(g.selectedRevision)||g.selectedRevision<1||g.selectedRevision>c.revision||(['COMPLETED','CORRECTED'].includes(g.status)&&!g.completionReceipt))throw new RangeError('INVALID_GOAL_LEDGER');
 }
 for(const r of l.rewards){const id=r.rewardId.slice(2) as SeasonGoalId;if(!r.rewardId.startsWith('R-')||!Object.hasOwn(SEASON_GOAL_DEFINITIONS,id)||r.type!==SEASON_GOAL_DEFINITIONS[id].rewardType||!r.firstReceipt||!r.sources.includes(r.firstReceipt)||new Set(r.sources).size!==r.sources.length)throw new RangeError('INVALID_GOAL_REWARD');}
}
function qualifiedTeams(c:GoalCareer,year:string,league:string):readonly string[]{
 if(isUs(c)){const b=year===c.world.seasonKey?(c.phaseContext.phase==='POSTSEASON_PROGRESS'?c.phaseContext.bracket:c.postseason?.bracket):c.minorYears?.find(y=>y.seasonKey===year)?.postseason.bracket;return b?(league==='MLB'?[...b.seeds.AL,...b.seeds.NL]:[]):qualifiedTeams(c.amateurHistory,year,league);}
 if(isKbo(c)){const b=year===c.world.seasonKey?c.postseason:c.proSeasons?.find(y=>y.seasonKey===year)?.postseason;return b?(league==='KBO'?b.seeds:[]):qualifiedTeams(c.amateurHistory,year,league);}
 const cup=year===c.world.seasonKey?c.collegeCup:c.previousSeasons?.find(y=>y.world.seasonKey===year)?.collegeCup;return league==='COLLEGE'?cup?.seeds??[]:[];
}
function progress(c:GoalCareer,g:SeasonGoalSlot):number {
 const key=registration(c).key,t=recordTotals(c.records,g.scope),b=t.batting[key],p=t.pitching[key];
 switch(g.goalId){
  case 'G01':return b?.PA??0;
  // shortcut: v1 has a fixed batting lineup; add explicit starts before pinch hitters enter the engine.
  case 'G02':return b?.games??0;
  case 'G03':return b?.HR??0;
  case 'G04':return b?.BB??0;
  case 'G05':return p?.K??0;
  case 'G06':return p?.starterOuts??0;
  case 'G07':return p?.SV??0;
  case 'G08':{
   const injury=c.health.games.find(h=>h.evidence.gameKey===g.injuryGameKey&&h.result.injured.includes(key));if(!injury)return 0;
   const recovered=c.health.games.find(h=>h.evidence.seasonKey===g.scope.seasonKey&&h.evidence.day>=injury.evidence.day&&h.result.recovered.includes(key));if(!recovered)return 0;
   return Number(Object.values(c.records.games).some(row=>row.scope.seasonKey===g.scope.seasonKey&&row.scope.leagueKey===g.scope.leagueKey&&row.scope.phase==='REGULAR'&&row.worldDay>=recovered.evidence.day&&((row.batting[key]?.PA??0)>0||(row.pitching[key]?.BF??0)>0)));
  }
  case 'G09':return Number(qualifiedTeams(c,g.scope.seasonKey,g.scope.leagueKey).includes(g.teamKey)&&c.health.games.some(h=>h.evidence.seasonKey===g.scope.seasonKey&&h.evidence.roster.includes(key)&&(h.evidence.teamKey===g.teamKey||h.evidence.teamKey===g.scope.leagueKey+':'+g.teamKey)&&c.records.games[h.evidence.gameKey]?.scope.phase==='REGULAR'&&c.records.games[h.evidence.gameKey]?.scope.leagueKey===g.scope.leagueKey));
  case 'G10':return Number((b?.PA??0)>0||(p?.BF??0)>0);
 }
}
function eligible(c:GoalCareer,id:SeasonGoalId):boolean {
 const r=registration(c),p=c.world.players[r.key]!,d=SEASON_GOAL_DEFINITIONS[id];
 return (d.kind==='BOTH'||d.kind===p.kind)&&(id!=='G08'||!!c.health.injuries[r.key]&&c.health.games.some(h=>h.evidence.gameKey===c.health.injuries[r.key]!.diagnosedGameKey&&h.result.injured.includes(r.key)))&&(id!=='G09'||['KBO','MLB','COLLEGE'].includes(r.league))&&(id!=='G10'||r.league==='COLLEGE');
}
function slot(c:GoalCareer,id:SeasonGoalId,index:number):SeasonGoalSlot {
 if(!Object.hasOwn(SEASON_GOAL_DEFINITIONS,id)||!eligible(c,id))throw new RangeError('GOAL_NOT_ELIGIBLE');const r=registration(c),injury=c.health.injuries[r.key];
 return {slot:index,goalId:id,scope:{seasonKey:c.world.seasonKey,leagueKey:r.league,phase:id==='G10'?'POSTSEASON':'REGULAR'},teamKey:r.team,status:'ACTIVE',progress:0,selectedRevision:c.revision+1,...(id==='G08'&&injury?{injuryGameKey:injury.diagnosedGameKey}:{})};
}
function teamGames(c:GoalCareer,s:SeasonGoals):number {return Object.values(c.records.games).filter(g=>g.scope.seasonKey===c.world.seasonKey&&g.scope.leagueKey===s.leagueKey&&g.scope.phase==='REGULAR'&&Object.hasOwn(g.teams,s.teamKey)).length;}
export function setCareerSeasonGoals<T extends GoalCareer>(c:T,revision:number,ids:readonly SeasonGoalId[]):T {
 assertRevision(c,revision);validate(c);if(c.phaseContext.phase!=='PRESEASON_SETUP')throw new RangeError('GOALS_LOCKED');
 if(!Array.isArray(ids)||ids.length>3||new Set(ids).size!==ids.length)throw new RangeError('GOAL_SLOT_CONFLICT');const r=registration(c);
 if(Object.values(c.records.games).some(g=>g.scope.seasonKey===c.world.seasonKey&&g.scope.phase==='REGULAR'))throw new RangeError('GOALS_LOCKED');
 const l=structuredClone(c.goals??empty(c)),old=l.seasons[c.world.seasonKey];l.seasons[c.world.seasonKey]={leagueKey:r.league,teamKey:r.team,scheduledGames:r.games,replacementUsed:false,slots:ids.map((id,i)=>slot(c,id,i)),history:[...(old?.history??[]),...(old?.slots.map(g=>({...g,status:'REPLACED' as const}))??[])]};
 return {...c,revision:revision+1,goals:l};
}
export function replaceCareerSeasonGoal<T extends GoalCareer>(c:T,revision:number,index:number,id:SeasonGoalId):T {
 assertRevision(c,revision);validate(c);const s=c.goals?.seasons[c.world.seasonKey],old=s?.slots.find(g=>g.slot===index);
 if(c.phaseContext.phase!=='SEASON_PROGRESS'||c.phaseContext.pendingGame||!s||!old||old.status!=='ACTIVE')throw new RangeError('GOAL_REPLACEMENT_NOT_ELIGIBLE');
 if(progress(c,old)>=SEASON_GOAL_DEFINITIONS[old.goalId].target)throw new RangeError('GOAL_REPLACEMENT_NOT_ELIGIBLE');
 if(s.replacementUsed)throw new RangeError('GOAL_REPLACEMENT_USED');if(teamGames(c,s)<Math.ceil(s.scheduledGames/2))throw new RangeError('GOAL_REPLACEMENT_WINDOW_NOT_OPEN');
 if(s.slots.some(g=>g.goalId===id))throw new RangeError('GOAL_SLOT_CONFLICT');const nextSlot=slot(c,id,index);nextSlot.progress=progress(c,nextSlot);if(nextSlot.progress>=SEASON_GOAL_DEFINITIONS[id].target)throw new RangeError('GOAL_ALREADY_SATISFIED');
 const l=structuredClone(c.goals!);l.seasons[c.world.seasonKey]={...l.seasons[c.world.seasonKey]!,replacementUsed:true,slots:l.seasons[c.world.seasonKey]!.slots.map(g=>g.slot===index?nextSlot:g),history:[...l.seasons[c.world.seasonKey]!.history,{...old,scope:{...old.scope},status:'REPLACED'}]};return {...c,revision:revision+1,goals:l};
}
/** SERVER ONLY: call after final official records/state changes, inside the caller's revision commit. */
export function refreshCareerSeasonGoals<T extends GoalCareer>(c:T):T {
 if(!c.goals)return c;validate(c);const l=structuredClone(c.goals),events=[...l.notices],key=registration(c).key;
 for(const [year,s]of Object.entries(l.seasons))for(const g of s.slots){
  if(g.status==='REPLACED'||g.status==='EXPIRED')continue;g.progress=progress(c,g);const reached=g.progress>=SEASON_GOAL_DEFINITIONS[g.goalId].target,correction=g.status==='COMPLETED'&&!reached;
  if(correction)g.status='CORRECTED';
  if(g.status==='ACTIVE'&&reached){g.status='COMPLETED';g.completionReceipt=JSON.stringify(['season-goal-completion',l.worldKey,key,year,g.slot,g.goalId,g.selectedRevision]);const rewardId='R-'+g.goalId,old=l.rewards.find(r=>r.rewardId===rewardId);l.rewards=old?l.rewards.map(r=>r.rewardId===rewardId?{...r,sources:[...r.sources,g.completionReceipt!]}:r):[...l.rewards,{rewardId,type:SEASON_GOAL_DEFINITIONS[g.goalId].rewardType,firstReceipt:g.completionReceipt,sources:[g.completionReceipt]}];}
  else if(g.status==='ACTIVE'&&(year!==c.world.seasonKey||c.phaseContext.phase==='ARCHIVED'||c.seasonGrowth?.finalized))g.status='EXPIRED';
  if((g.status==='COMPLETED'&&!c.goals.seasons[year]!.slots.find(old=>old.slot===g.slot)!.completionReceipt)||correction){const d=eventDefinition('E90'),day=Object.values(c.records.games).reduce((n,row)=>row.scope.seasonKey===year?Math.max(n,row.worldDay):n,0);events.push(createWorldEvent({definitionId:'E90',worldKey:l.worldKey,seasonKey:year,evidence:{version:1,type:d.evidenceDomain,fields:{playerSimulationKey:key,worldSeasonId:year,goalId:g.goalId,stage:g.status}},resume:{worldKey:l.worldKey,seasonKey:year,phase:'SEASON_REVIEW',competitionKey:g.scope.leagueKey,registrationKey:g.teamKey,sourceRevision:c.revision},sourceSequence:events.length+1,worldDay:day}));}
 }
 l.notices=events;if(canonicalJson(l)===canonicalJson(c.goals))return c;return {...c,goals:l};
}
export function careerSeasonGoalsView(c:GoalCareer){
 assertRevision(c,c.revision);validate(c);const r=registration(c),s=c.goals?.seasons[c.world.seasonKey],definitions=(Object.keys(SEASON_GOAL_DEFINITIONS) as SeasonGoalId[]).filter(id=>eligible(c,id)).map(id=>({goalId:id,...SEASON_GOAL_DEFINITIONS[id],rewardId:'R-'+id}));
 return {seasonKey:c.world.seasonKey,playerKey:r.key,sourceDifficulty:c.difficulty,definitions,recommendedIds:recommend(c,definitions.map(d=>d.goalId)),noticeDelivery:'OUTBOX' as const,notices:(c.goals?.notices??[]).map(n=>({eventKey:n.eventKey,version:n.version,status:n.status,goalId:n.evidence.fields.goalId,stage:n.evidence.fields.stage,title:eventDefinition(n.definitionId).title})),history:(s?.history??[]).map(g=>({...g,scope:{...g.scope}})),slots:(s?.slots??[]).map(g=>({...g,scope:{...g.scope},progress:progress(c,g),target:SEASON_GOAL_DEFINITIONS[g.goalId].target,previousLeague:g.scope.leagueKey!==r.league})),replacement:{used:s?.replacementUsed??false,open:!!s&&!s.replacementUsed&&c.phaseContext.phase==='SEASON_PROGRESS'&&!c.phaseContext.pendingGame&&s.slots.some(g=>g.status==='ACTIVE'&&progress(c,g)<SEASON_GOAL_DEFINITIONS[g.goalId].target)&&teamGames(c,s)>=Math.ceil(s.scheduledGames/2)},rewards:c.goals?.rewards.map(reward=>({...reward,sources:[...reward.sources]}))??[],gameplayRewardDelta:0 as const};
}

function recommend(c:GoalCareer,ids:SeasonGoalId[]):SeasonGoalId[]{
 const r=registration(c),year=String(Number(c.world.seasonKey)-1),t=recordTotals(c.records,{seasonKey:year,leagueKey:r.league,phase:'REGULAR'}),sample=(t.batting[r.key]?.PA??0)+(t.pitching[r.key]?.BF??0);
 if(!sample){const defaults=c.world.players[r.key]!.kind==='HITTER'?['G01','G04','G09']:['G05','G06','G09'];return [...defaults.filter(id=>ids.includes(id as SeasonGoalId)),...ids.filter(id=>!defaults.includes(id))].slice(0,3) as SeasonGoalId[];}
 return ids.map(id=>{const g=slot(c,id,0),now=progress(c,g),prior=progress(c,{...g,scope:{...g.scope,seasonKey:year}}),ratio=prior/SEASON_GOAL_DEFINITIONS[id].target;return {id,preferred:ratio>=.5&&ratio<=1.2,now};}).sort((a,b)=>Number(b.preferred)-Number(a.preferred)||b.now-a.now||(a.id<b.id?-1:1)).slice(0,3).map(r=>r.id);
}