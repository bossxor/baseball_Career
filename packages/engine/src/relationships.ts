import type {TeamEntryRelationReceipt} from './team-teammates.js';
import {abilityKeys} from '@playball/rules';
import {createStreams,nextInteger} from './rng.js';
import type {HighSchoolWorld} from './high-school-world.js';
import type {DevelopmentPlayer} from './player.js';
import type {RecordLedger,GameContribution} from './records.js';

export type RelationType='RIVAL'|'TEAMMATE';
export type RelationStage='FORMED'|'SEPARATED'|'REUNITED_OPPONENT'|'REUNITED_TEAM'|'RETIRED';
export interface RelationMilestone {stage:RelationStage;evidenceKey:string;worldDay:number;kind?:'FORMATION'|'COEXIST_20'}
export interface PlayerRelationship {relationKey:string;type:RelationType;normalPairKey:string;primaryPlayerKey:string;otherPlayerKey:string;stage:RelationStage;milestones:readonly RelationMilestone[]}
export interface RelationshipLedger {
 schemaVersion:1;relations:readonly PlayerRelationship[];
 teamEntries?:readonly TeamEntryRelationReceipt[];
 /** Why a role is empty. Empty is a normal state and never blocks the career. */
 formation:{rival:'FORMED'|'NO_CANDIDATE';teammate:'FORMED'|'NO_CANDIDATE'};
}
const sum=(p:DevelopmentPlayer)=>abilityKeys(p.kind).reduce((s,k)=>s+p.abilities[k]!,0);
const pairKey=(a:string,b:string)=>JSON.stringify([a,b].sort());

/** 60/51 high-school start: one same-team teammate first, then one rival from the eligible pool excluding that teammate.
 * Overall gap uses exact ability units (5 display points = 300,000 units over six abilities). Uses its own seed stream. */
export function formHighSchoolRelations(world:HighSchoolWorld,worldDay:number):RelationshipLedger {
 const me=world.players[world.protagonistKey];if(!me)throw new RangeError('MISSING_PROTAGONIST');
 const school=world.schools.find(s=>s.id===world.protagonistSchoolId);if(!school)throw new RangeError('MISSING_SCHOOL');
 const others=Object.values(world.players).filter(p=>p.simulationKey!==me.simulationKey && p.kind===me.kind);
 const teammate=others.filter(p=>school.roster.includes(p.simulationKey))
  .sort((a,b)=>Math.abs(a.age-me.age)-Math.abs(b.age-me.age) || (a.simulationKey<b.simulationKey?-1:1))[0];
 const candidates=others.filter(p=>p.simulationKey!==teammate?.simulationKey && Math.abs(p.age-me.age)<=1 && Math.abs(sum(p)-sum(me))<=300_000)
  .sort((a,b)=>a.simulationKey<b.simulationKey?-1:1);
 let rival:DevelopmentPlayer|undefined;
 if(candidates.length){const draw=nextInteger(createStreams(world.seed,JSON.stringify(['relation-formation',world.worldKey])).worldCreation,candidates.length);rival=candidates[draw.value];}
 const relation=(type:RelationType,other:DevelopmentPlayer):PlayerRelationship=>{const key=pairKey(me.simulationKey,other.simulationKey);
  return {relationKey:JSON.stringify([type,key]),type,normalPairKey:key,primaryPlayerKey:me.simulationKey,otherPlayerKey:other.simulationKey,stage:'FORMED',milestones:[{stage:'FORMED',evidenceKey:JSON.stringify(['hs-formation',world.worldKey,type]),worldDay}]};};
 return {schemaVersion:1,relations:[...(rival?[relation('RIVAL',rival)]:[]),...(teammate?[relation('TEAMMATE',teammate)]:[])],formation:{rival:rival?'FORMED':'NO_CANDIDATE',teammate:teammate?'FORMED':'NO_CANDIDATE'}};
}

export function validateRelationshipLedger(ledger:RelationshipLedger,world:HighSchoolWorld):void {
 if(ledger.schemaVersion!==1)throw new RangeError('INVALID_RELATIONSHIPS');
 const seen=new Set<string>(),roles=new Set<string>();
 for(const r of ledger.relations){
  if(seen.has(r.relationKey) || roles.has(r.otherPlayerKey) || !world.players[r.otherPlayerKey] || r.otherPlayerKey===r.primaryPlayerKey || r.normalPairKey!==pairKey(r.primaryPlayerKey,r.otherPlayerKey) || r.milestones.length===0)throw new RangeError('INVALID_RELATIONSHIPS');
  seen.add(r.relationKey);roles.add(r.otherPlayerKey);
 }
}

/** S42 list projection: identity by name, hand and form only (119). No abilities, potential or seeds. */
export function relationshipListView(ledger:RelationshipLedger|undefined,world:HighSchoolWorld) {
 const schoolName=(key:string)=>world.schools.find(s=>s.roster.includes(key))?.name??null;
 // Relations to players outside the current world stay stored; their separation stages are a later transition.
 return (ledger?.relations??[]).filter(r=>Object.hasOwn(world.players,r.otherPlayerKey)).map(r=>{const p=world.players[r.otherPlayerKey]!;
  return {relationKey:r.relationKey,type:r.type,stage:r.stage,other:{name:p.name,kind:p.kind,position:p.position,throws:p.throws,bats:p.bats,pitchForm:p.pitchForm??null,schoolName:schoolName(p.simulationKey)}};});
}

const rate=(num:number,den:number)=>den>0?(num/den).toFixed(3).replace(/^0/,''):'-';
export interface RelationScope {leagueKey:string;phase:'REGULAR'|'POSTSEASON'|'INTERNATIONAL';seasonKey?:string}
/** S42 detail (60): same-kind pairs never pretend to face each other; they compare their own lines in games both played.
 * Cross-kind pairs show only real batter-vs-pitcher plate appearances. Leagues/phases never mix. Read-only. */
export function relationDetailView(source:{world:HighSchoolWorld;records:RecordLedger;relationships?:RelationshipLedger},relationKey:string,scope:RelationScope) {
 const relation=source.relationships?.relations.find(r=>r.relationKey===relationKey);if(!relation)throw new RangeError('UNKNOWN_RELATION');
 const me=source.world.players[relation.primaryPlayerKey],other=source.world.players[relation.otherPlayerKey];
 if(!me || !other)return {relationKey,mode:'UNAVAILABLE' as const,reason:'OTHER_NOT_IN_CURRENT_WORLD' as const};
 const games=Object.values(source.records.games).filter(g=>g.scope.leagueKey===scope.leagueKey && g.scope.phase===scope.phase && (scope.seasonKey===undefined || g.scope.seasonKey===scope.seasonKey));
 if(games.length===0)return {relationKey,mode:'EMPTY' as const,reason:'NO_GAMES_IN_SCOPE' as const};
 const played=(g:GameContribution,k:string)=>Object.hasOwn(g.batting,k) || Object.hasOwn(g.pitching,k);
 if(me.kind===other.kind) {
  const shared=games.filter(g=>played(g,me.simulationKey) && played(g,other.simulationKey));
  const line=(k:string)=>{let PA=0,AB=0,H=0,BB=0,HBP=0,HR=0,TB=0,K=0,outs=0,ER=0;
   for(const g of shared){const b=g.batting[k],p=g.pitching[k];if(b){PA+=b.PA;AB+=b.AB;H+=b.H;BB+=b.BB;HBP+=b.HBP;HR+=b.HR;TB+=b.TB;K+=b.K;}if(p){outs+=p.outs;ER+=p.ER;K+=p.K;}}
   return me.kind==='HITTER'?{PA,AB,H,HR,BB,K,AVG:rate(H,AB),OBP:rate(H+BB+HBP,AB+BB+HBP),SLG:rate(TB,AB)}:{outs,K,ER,ERA:outs>0?(ER*27/outs).toFixed(2):'-'};};
  return {relationKey,mode:'COMPARISON' as const,sharedGames:shared.length,mine:line(me.simulationKey),theirs:line(other.simulationKey),note:'같은 종류 선수끼리는 직접 상대 전적을 제공하지 않습니다.'};
 }
 const [batter,pitcher]=me.kind==='HITTER'?[me,other]:[other,me];
 const s={PA:0,AB:0,H:0,BB:0,HBP:0,K:0,TB:0,HR:0};
 for(const g of games)for(const m of Object.values(g.matchups))if(m.batterKey===batter.simulationKey && m.pitcherKey===pitcher.simulationKey)for(const k of Object.keys(s) as (keyof typeof s)[])s[k]+=m.stats[k];
 return {relationKey,mode:'DIRECT' as const,batterKey:batter.simulationKey,pitcherKey:pitcher.simulationKey,stats:{...s,AVG:rate(s.H,s.AB),OBP:rate(s.H+s.BB+s.HBP,s.AB+s.BB+s.HBP),SLG:rate(s.TB,s.AB)}};
}

/** 60/51: a teammate's first milestone is 20 shared registered team game days in one regular season (rest/rain days are not games).
 * Regular school rosters do not change within a season, so current roster membership is the registration for each game day. */
export function refreshRelationMilestones(source:{world:HighSchoolWorld;records:RecordLedger;relationships?:RelationshipLedger}):RelationshipLedger|undefined {
 if(!source.relationships)return source.relationships;
 const ledger=structuredClone(source.relationships),school=source.world.schools.find(s=>s.id===source.world.protagonistSchoolId);
 if(!school)return ledger;
 const leagueKey=source.world.leagueKey??'HS';
 const days=[...new Set(Object.values(source.records.games).filter(g=>g.scope.leagueKey===leagueKey && g.scope.phase==='REGULAR' && g.scope.seasonKey===source.world.seasonKey && Object.hasOwn(g.teams,school.id)).map(g=>g.worldDay))].sort((a,b)=>a-b);
 ledger.relations=ledger.relations.map(r=>{
  if(r.type!=='TEAMMATE' || r.milestones.some(m=>m.kind==='COEXIST_20'))return r;
  if(!school.roster.includes(r.primaryPlayerKey) || !school.roster.includes(r.otherPlayerKey) || days.length<20)return r;
  return {...r,milestones:[...r.milestones,{stage:r.stage,kind:'COEXIST_20',evidenceKey:JSON.stringify(['coexist20',r.relationKey,source.world.seasonKey]),worldDay:days[19]!}]};
 });
 return ledger;
}
