import {roleScore} from '@playball/rules';
import type {ActiveKboRosterWorld} from './kbo-career-entry.js';
import type {RecordLedger} from './records.js';
import {recordTotals} from './records.js';
import type {HealthLedger} from './health.js';
import {recentBattingPerformance,recentPitchingPerformance} from './lineup.js';
import {emptyBatting,emptyPitching} from './stats.js';

/** 21 + 2026-10-22 user rule (14 U): every year the military sports team selects 10 hitters and 10 pitchers.
 * Age window is the 19..27 game age of the application window. */
export const KBO_SANGMU_INTAKE={hitters:10,pitchers:10,minAge:19,maxAge:27} as const;
/** Implementation default D (the 10-player role split is still to be specified by the user): the squad must be able to
 * field a legal lineup, so each of the eight fielding positions gets its best applicant first (when one exists), and
 * pitchers keep at least three starters; the remaining places follow the score. */
export const KBO_SANGMU_FIELD_POSITIONS=['C','1B','2B','3B','SS','LF','CF','RF'] as const;
export const KBO_SANGMU_MIN_ROLES={starters:3} as const;
/** Implementation default D: one club cannot lose more than this many of one kind in a yearly intake, so every Futures squad keeps
 * the nine healthy hitters a legal lineup needs (the pro baseline is 11 Futures hitters per club). */
export const KBO_SANGMU_CLUB_CAP={hitters:1,pitchers:2} as const;

export interface SangmuApplicant {playerKey:string;clubId:string;kind:'HITTER'|'PITCHER';position:string;age:number;score:number}
export interface SangmuSelection {seasonKey:string;snapshotKey:string;selected:readonly SangmuApplicant[];applicants:number;vacancies:{hitters:number;pitchers:number}}

function fnv(text:string):number {let h=0x811c9dc5;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}return h;}
function pick<T extends object>(source:T,keys:readonly string[]):Partial<T>{return Object.fromEntries(Object.entries(source).filter(([k])=>keys.includes(k))) as Partial<T>;}

/** One yearly snapshot: score = .6 role score + .4 performance index over the last two seasons' official KBO and Futures
 * regular lines (sample-weighted by summing PA/outs; the shared index uses 50 below its sample). Healthy players of the
 * window only; already-serving players and `excluded` keys (my player applies through the user path) are skipped.
 * Ties: younger, then a stable seed hash, then key. Missing healthy applicants leave vacancies; nobody is invented. */
export function selectSangmuCohort(input:{world:ActiveKboRosterWorld;records:RecordLedger;health:HealthLedger;seasonKey:string;serving?:ReadonlySet<string>;excluded?:ReadonlySet<string>;reserved?:{hitters:number;pitchers:number}}):SangmuSelection {
 const {world,records,health,seasonKey}=input,seasons=[String(Number(seasonKey)-1),seasonKey];
 const line=<K extends 'batting'|'pitching'>(key:string,field:K) => {
  const sum:Record<string,number>={};
  for(const season of seasons)for(const league of ['KBO','FUTURES']){const t=recordTotals(records,{leagueKey:league,phase:'REGULAR',seasonKey:season})[field][key];if(t)for(const [k,v] of Object.entries(t))sum[k]=(sum[k]??0)+(v as number);}
  return sum;
 };
 const applicants:SangmuApplicant[]=[];
 for(const club of world.clubs)for(const key of club.roster){
  const p=world.players[key]!;
  if(p.age<KBO_SANGMU_INTAKE.minAge || p.age>KBO_SANGMU_INTAKE.maxAge || Object.hasOwn(health.injuries,key) || input.serving?.has(key) || input.excluded?.has(key))continue;
  const perf=p.kind==='HITTER'?recentBattingPerformance({...emptyBatting(),...pick(line(key,'batting'),Object.keys(emptyBatting()))}):recentPitchingPerformance({...emptyPitching(),...pick(line(key,'pitching'),Object.keys(emptyPitching()))});
  applicants.push({playerKey:key,clubId:club.id,kind:p.kind,position:p.position,age:p.age,score:.6*roleScore(p.kind,p.abilities,p.position)+.4*perf});
 }
 const tie=(a:SangmuApplicant)=>fnv(JSON.stringify(['sangmu',world.seed,world.worldKey,seasonKey,a.playerKey]));
 const order=(a:SangmuApplicant,b:SangmuApplicant)=>b.score-a.score || a.age-b.age || tie(a)-tie(b) || (a.playerKey<b.playerKey?-1:1);
 const choose=(kind:'HITTER'|'PITCHER',count:number,musts:readonly ((a:SangmuApplicant)=>boolean)[],minEach:number,cap:number)=>{
  const pool=applicants.filter(a=>a.kind===kind).sort(order),chosen:SangmuApplicant[]=[];
  const room=(a:SangmuApplicant)=>chosen.length<count && !chosen.includes(a) && chosen.filter(c=>c.clubId===a.clubId).length<cap;
  for(const must of musts){let taken=0;for(const a of pool.filter(must))if(taken<minEach && room(a)){chosen.push(a);taken++;}}
  for(const a of pool)if(room(a))chosen.push(a);
  return chosen.sort(order);
 };
 const hitters=choose('HITTER',KBO_SANGMU_INTAKE.hitters-(input.reserved?.hitters??0),KBO_SANGMU_FIELD_POSITIONS.map(p=>(a:SangmuApplicant)=>a.position===p),1,KBO_SANGMU_CLUB_CAP.hitters);
 const pitchers=choose('PITCHER',KBO_SANGMU_INTAKE.pitchers-(input.reserved?.pitchers??0),[a=>a.position==='SP'],KBO_SANGMU_MIN_ROLES.starters,KBO_SANGMU_CLUB_CAP.pitchers);
 return {seasonKey,snapshotKey:JSON.stringify(['sangmu-selection',world.worldKey,seasonKey]),selected:[...hitters,...pitchers],applicants:applicants.length,vacancies:{hitters:KBO_SANGMU_INTAKE.hitters-(input.reserved?.hitters??0)-hitters.length,pitchers:KBO_SANGMU_INTAKE.pitchers-(input.reserved?.pitchers??0)-pitchers.length}};
}
