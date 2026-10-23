import {kboAiRoleNeed} from './kbo-ai-offseason.js';
import {kboClubBalance,kboRecruitmentOpen} from './kbo-finance.js';
import {KBO_MONEY,KBO_ROSTER_LIMITS,roleScore} from '@playball/rules';
import type {ActiveKboRosterWorld} from './kbo-career-entry.js';
import {generateSchoolNpcRoster,HITTER_POSITIONS,PITCHER_POSITIONS} from './school-roster.js';
import type {SchoolNpcTemplate} from './school-roster.js';

export const KBO_ROOKIE_CLASS={size:100,rounds:10} as const;
export interface KboRookiePick {round:number;pick:number;clubId:string;playerKey:string}
export interface KboRookieDraftReceipt {seasonKey:string;batchKey:string;classKeys:readonly string[];picks:readonly KboRookiePick[]}

/** 15 yearly supply: a deterministic class of 100 prospects (batch key = target season, so a retry reuses it), drafted
 * in 10 rounds in reverse standings order (worst club first, same order every round). Each club takes the best
 * remaining player at its most under-filled role group (08/44 need tiers 100/50/10: C2, SP5, relief8, each other primary hitter position1) and skips the
 * pick when it has no roster/budget room. Contracts are the 05 one-year minimum. Mutates the caller's cloned world.
 * ponytail: undrafted prospects vanish and full clubs skip picks; AI offseason market/repair is handled by the transition before this draft. */
export function draftKboRookieClass(world:ActiveKboRosterWorld,seasonKey:string,worstFirst:readonly string[],difficulty:'GROWTH'|'REALISTIC'|'SECRET_CHEAT'):KboRookieDraftReceipt {
 const batchKey=JSON.stringify(['kbo-rookie-batch',world.worldKey,seasonKey]),templates:SchoolNpcTemplate[]=[];
 const pattern=[...HITTER_POSITIONS.map(p=>['HITTER',p] as const),...PITCHER_POSITIONS.map(p=>['PITCHER',p] as const)];
 for(let i=0;i<KBO_ROOKIE_CLASS.size;i++){const [kind,position]=pattern[i%pattern.length]!;templates.push({simulationKey:JSON.stringify(['kbo-rookie',seasonKey,i]),kind,position,schoolId:'KBO-DRAFT'});}
 if(templates.some(t=>Object.hasOwn(world.players,t.simulationKey)) || new Set(worstFirst).size!==world.clubs.length)throw new RangeError('KBO_ROOKIE_BATCH_CONFLICT');
 const generated=generateSchoolNpcRoster({templates,seed:world.seed,worldKey:batchKey,seasonKey,difficulty,balanceVersion:2});
 const pool=new Set(Object.keys(generated.players)),picks:KboRookiePick[]=[];
 for(let round=1;round<=KBO_ROOKIE_CLASS.rounds;round++)for(const [slot,clubId] of worstFirst.entries()){
  const club=world.clubs.find(c=>c.id===clubId)!;
  if(!kboRecruitmentOpen(world,club.id) || club.roster.length>=KBO_ROSTER_LIMITS.maximum || kboClubBalance(world,club.id).availableWon<KBO_MONEY.minimumSalaryWon || club.paidSalaryWon+club.reservedSalaryWon+kboClubBalance(world,club.id).guaranteedWon+KBO_MONEY.minimumSalaryWon>club.budgetWon*.9)continue;
  const members=club.roster.map(k=>world.players[k]!);
  let best:{key:string;tier:number;score:number}|null=null;
  for(const key of [...pool].sort()){
   const p=generated.players[key]!,score=roleScore(p.kind,p.abilities,p.position),t=kboAiRoleNeed(p,members).needScore;
   if(!best || t>best.tier || t===best.tier && score>best.score)best={key,tier:t,score};
  }
  if(!best)break;
  const p=generated.players[best.key]!;pool.delete(best.key);
  world.players[best.key]={...p,age:18};if(generated.repertoires[best.key])world.repertoires[best.key]=generated.repertoires[best.key]!;
  world.contracts[best.key]={contractKey:JSON.stringify(['kbo-rookie-contract',batchKey,best.key]),playerKey:best.key,clubId,seasonKey,years:1,annualSalaryWon:KBO_MONEY.minimumSalaryWon,signingBonusWon:0,status:'ACTIVE'};
  club.roster=[...club.roster,best.key].sort();club.reservedSalaryWon+=KBO_MONEY.minimumSalaryWon;picks.push({round,pick:slot+1,clubId,playerKey:best.key});
 }
 return {seasonKey,batchKey,classKeys:Object.keys(generated.players),picks};
}
