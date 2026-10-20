import { abilityKeys, assertAbilities } from '@playball/rules';
import type { AbilityUnits, PlayerKind } from '@playball/rules';
import { createWorldStream, nextFloat } from './rng.js';
export interface PotentialRange {lowUnits:number;highUnits:number}
export interface AssessmentProgress { observed: {gameKey:string;worldDay:number;seasonYear?:number}[]; stage:number }
export function ownAssessmentLevel(completedProSeasons:number):number {
  if(!Number.isSafeInteger(completedProSeasons) || completedProSeasons<0) throw new RangeError('INVALID_PRO_SEASONS');
  return Math.min(5,2+Math.floor(completedProSeasons/2));
}
/** Deterministic per ability/model. Never advances an ongoing world/game stream. */
function assessmentOffset(playerKey:string,abilityKey:string,modelVersion:string):number {
  return nextFloat(createWorldStream(JSON.stringify(['assessment',modelVersion]),JSON.stringify([playerKey,abilityKey]),'potential')).value;
}
export function potentialRange(input:{currentUnits:number;potentialUnits:number;level:number;stage:number;z:number;previous?:PotentialRange}):PotentialRange {
  const {currentUnits:a,potentialUnits:p,level,stage,z,previous}=input;
  if(!Number.isSafeInteger(a) || !Number.isSafeInteger(p) || a<10_000 || p<a || p>1_000_000 || !Number.isInteger(level) || level<1 || level>5 || !Number.isInteger(stage) || stage<0 || stage>4 || !Number.isFinite(z) || z<0 || z>1) throw new RangeError('INVALID_ASSESSMENT');
  const width=Math.min(1_000_000-a,Math.max(20_000,[200_000,160_000,120_000,80_000,60_000][level-1]!-20_000*stage));
  const rawLow=Math.max(a,Math.min(1_000_000-width,Math.floor(p-z*width))),rawHigh=rawLow+width;
  if(previous && (!Number.isSafeInteger(previous.lowUnits) || !Number.isSafeInteger(previous.highUnits) || previous.lowUnits<10_000 || previous.highUnits>1_000_000 || previous.lowUnits>p || previous.highUnits<p)) throw new RangeError('ASSESSMENT_INCONSISTENT');
  const lowUnits=Math.max(a,rawLow,previous?.lowUnits??a),highUnits=Math.min(1_000_000,rawHigh,previous?.highUnits??1_000_000);
  if(lowUnits>p || highUnits<p || lowUnits>highUnits) throw new RangeError('ASSESSMENT_INCONSISTENT');
  return {lowUnits,highUnits};
}
export function reconcileAssessment(input:{playerKey:string;modelVersion:string;kind:PlayerKind;abilities:AbilityUnits;potential:AbilityUnits;level:number;stage:number;previous?:Readonly<Record<string,PotentialRange>>}):Record<string,PotentialRange> {
  if(!input.playerKey || !input.modelVersion) throw new RangeError('INVALID_ASSESSMENT_ID');
  assertAbilities(input.kind,input.abilities);assertAbilities(input.kind,input.potential);
  if(input.previous && (Object.keys(input.previous).length!==6 || abilityKeys(input.kind).some(key=>!Object.hasOwn(input.previous!,key)))) throw new RangeError('ASSESSMENT_INCONSISTENT');
  return Object.fromEntries(abilityKeys(input.kind).map(key=>[key,potentialRange({currentUnits:input.abilities[key]!,potentialUnits:input.potential[key]!,level:input.level,stage:input.stage,z:assessmentOffset(input.playerKey,key,input.modelVersion),...(input.previous?{previous:input.previous[key]!}:{})})]));
}
/** Caller supplies only actual eligible registered-team regular games, including healthy nonappearances. */
export function observeAssessmentProgress(source:AssessmentProgress,evidence:AssessmentProgress['observed'][number]):AssessmentProgress {
  if(source.stage!==Math.min(4,Math.floor(source.observed.length/20)) || !evidence.gameKey || !Number.isSafeInteger(evidence.worldDay) || evidence.worldDay<0 || evidence.seasonYear!==undefined && (!Number.isSafeInteger(evidence.seasonYear) || evidence.seasonYear<1)) throw new RangeError('INVALID_OBSERVATION');
  const old=source.observed.find(e=>e.gameKey===evidence.gameKey);
  if(old) {if(old.worldDay!==evidence.worldDay || old.seasonYear!==evidence.seasonYear) throw new RangeError('EVIDENCE_REUSED');return structuredClone(source);}
  if(source.observed.some(e=>e.worldDay===evidence.worldDay && e.seasonYear===evidence.seasonYear)) throw new RangeError('DUPLICATE_REGISTRATION_DAY');
  const last=source.observed.at(-1),year=evidence.seasonYear??0,lastYear=last?.seasonYear??0;
  if(last && (year<lastYear || year===lastYear && evidence.worldDay<last.worldDay)) throw new RangeError('OBSERVATION_OUT_OF_ORDER');
  const observed=[...source.observed,{...evidence}];return {observed,stage:Math.min(4,Math.floor(observed.length/20))};
}
/** Explicit allowlist: this function cannot accidentally spread internal P/seed/RNG into the view. */
export function assessmentView(input:{kind:PlayerKind;abilities:AbilityUnits;ranges:Readonly<Record<string,PotentialRange>>;progress:AssessmentProgress;fixedCheat:boolean}) {
  assertAbilities(input.kind,input.abilities);
  return {mode:input.fixedCheat?'FIXED_CHEAT':'RANGE',stage:input.progress.stage,nextObservationGames:input.progress.stage>=4?null:20-input.progress.observed.length%20,abilities:abilityKeys(input.kind).map(key=>{
    const range=input.ranges[key];if(!range) throw new RangeError('ASSESSMENT_PENDING');
    const lowUnits=Math.max(input.abilities[key]!,range.lowUnits),highUnits=range.highUnits;
    if(lowUnits>highUnits) throw new RangeError('ASSESSMENT_INCONSISTENT');
    return {abilityKey:key,current:input.abilities[key]!/10_000,...(input.fixedCheat?{fixedPotential:100}:{potentialRange:{low:Math.floor(lowUnits/10_000),high:Math.ceil(highUnits/10_000)}})};
  })};
}
export function assessmentMidpointScore(kind:PlayerKind,ranges:Readonly<Record<string,PotentialRange>>):number {
  const values=abilityKeys(kind).map(key=>{const r=ranges[key];if(!r || !Number.isSafeInteger(r.lowUnits) || !Number.isSafeInteger(r.highUnits) || r.lowUnits>r.highUnits || r.lowUnits<10_000 || r.highUnits>1_000_000) throw new RangeError('ASSESSMENT_INCONSISTENT');return (r.lowUnits+r.highUnits)/20_000;});
  return values.reduce((a,b)=>a+b,0)/6;
}
