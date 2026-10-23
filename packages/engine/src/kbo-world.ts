import type {KboRemainderPay} from './kbo-remainder-pay.js';
import type {KboServicePayroll} from './kbo-service-payroll.js';
import type {KboFinanceLedger} from './kbo-finance.js';
import {abilityKeys,HITTER_TYPES,PITCHER_TYPES,PITCH_IDS,KBO_CLUBS,KBO_MONEY,overall,roleScore} from '@playball/rules';
import type {Difficulty,PlayerKind,AbilityUnits} from '@playball/rules';
import {createWorldStream,nextFloat,nextInteger,validateRng} from './rng.js';
import type {RngState} from './rng.js';
import {generateNpcIdentities,generateNpcPotential} from './npc.js';
import type {NpcIdentity} from './npc.js';
import {archetypeFor,validateDevelopmentPlayer} from './player.js';
import type {DevelopmentPlayer} from './player.js';
import {createRepertoire,validatePitchWeights} from './repertoire.js';
import type {Repertoire} from './repertoire.js';
import {automaticFieldLineup,initialPositionFits} from './lineup.js';
import {emptyBatting} from './stats.js';
import {initialProfileAbilities} from './initial-abilities.js';
const H_POSITIONS=['C','C','C','C','1B','1B','1B','2B','2B','2B','3B','3B','3B','SS','SS','SS','LF','LF','LF','CF','CF','CF','RF','RF','RF','DH'];
const P_POSITIONS=[...Array<string>(8).fill('SP'),...Array<string>(12).fill('RP'),...Array<string>(4).fill('CP')];
export interface KboInitialContract {contractKey:string;playerKey:string;clubId:string;seasonKey:string;years:number;annualSalaryWon:number;signingBonusWon:0;status:'ACTIVE'|'ACTIVE_PRORATED';servicePay?:KboServicePayroll;remainderPay?:KboRemainderPay}
export interface KboClub {id:string;name:string;roster:string[];firstTeam:string[];budgetWon:number;paidSalaryWon:number;reservedSalaryWon:number}
export interface KboRosterWorld {finance?:KboFinanceLedger;suspendedContracts?:Record<string,KboInitialContract>;schemaVersion:1;status:'CREATED';worldKey:string;seasonKey:string;seed:string;difficulty:Difficulty;clubs:KboClub[];players:Record<string,DevelopmentPlayer>;repertoires:Record<string,Repertoire>;contracts:Record<string,KboInitialContract>;rng:{roster:RngState;potential:RngState;handedness:RngState};generationAttempts:number}
const dict=<T>():Record<string,T>=>Object.create(null) as Record<string,T>;
/** Common-offset water filling retains profile shape, mean exactly target, and six ceilings100. */
export function kboInitialAbilities(kind:PlayerKind,archetype:string,target:number):AbilityUnits {
 if(!Number.isInteger(target) || target<35 || target>85)throw new RangeError('INVALID_KBO_TARGET');
  return initialProfileAbilities(kind,archetype,target);
}
/** 08 value with no qualifying prior sample;44 common scale, minimum floor, integer10,000 won. */
export function initialKboSalaries(players:readonly DevelopmentPlayer[]):Record<string,number> {
 if(players.length!==50 || new Set(players.map(p=>p.simulationKey)).size!==50)throw new RangeError('INVALID_SALARY_ROSTER');
 const sorted=[...players].sort((a,b)=>a.simulationKey<b.simulationKey?-1:1);
 const raw=sorted.map(p=>{validateDevelopmentPlayer(p);const o=overall(p.kind,p.abilities);return (30_000_000+Math.max(0,o.sumUnits/o.denominator-40)*10_000_000)/10_000;});
 const minimum=KBO_MONEY.minimumSalaryWon/10_000,maximum=KBO_MONEY.maximumSalaryWon/10_000,target=KBO_MONEY.initialPayrollWon/10_000;
 const scaled=(x:number,k:number)=>Math.max(minimum,Math.min(maximum,x*k));
 let low=0,high=target/(minimum*50);
 for(let i=0;i<64;i++){const mid=(low+high)/2;if(raw.reduce((sum,x)=>sum+scaled(x,mid),0)<=target)low=mid;else high=mid;}
 const precise=raw.map(x=>scaled(x,low)),amounts=precise.map(Math.floor);let remaining=target-amounts.reduce((a,b)=>a+b,0);
 const order=sorted.map((_,i)=>i).sort((a,b)=>(precise[b]!-amounts[b]!)-(precise[a]!-amounts[a]!) || a-b);
 for(const i of order)if(remaining>0 && amounts[i]!<maximum){amounts[i]=amounts[i]!+1;remaining--;}
 if(remaining!==0)throw new RangeError('KBO_SALARY_ALLOCATION_FAILED');
 return Object.fromEntries(sorted.map((p,i)=>[p.simulationKey,amounts[i]!*10_000]));
}
/** Opening selection with no prior-season sample (41/44). Caller filters unavailable players; no RNG or payroll mutation. */
export function selectKboFirstTeamRoster(players:readonly DevelopmentPlayer[]):string[] {
 const hitters=players.filter(p=>p.kind==='HITTER'),pitchers=players.filter(p=>p.kind==='PITCHER');
 const rank=(position:string)=>(a:DevelopmentPlayer,b:DevelopmentPlayer)=>roleScore(b.kind,b.abilities,position)-roleScore(a.kind,a.abilities,position) || (a.simulationKey<b.simulationKey?-1:1);
 const selection=automaticFieldLineup(hitters.map(player=>({player,available:true,fits:initialPositionFits(player.position),recent:emptyBatting()})),100),chosen=new Set(selection.lineup);
 for(const catcher of hitters.filter(p=>p.position==='C').sort(rank('C')))if([...chosen].filter(k=>hitters.find(p=>p.simulationKey===k)!.position==='C').length<2)chosen.add(catcher.simulationKey);
 for(const p of [...hitters].sort(rank('DH')))if(chosen.size<15)chosen.add(p.simulationKey);
 for(const [position,count] of [['SP',5],['RP',6],['CP',2]] as const)for(const p of pitchers.filter(p=>p.position===position).sort(rank(position)).slice(0,count))chosen.add(p.simulationKey);
 return [...chosen].sort();
}
function balanced(clubs:readonly KboClub[],players:Readonly<Record<string,DevelopmentPlayer>>):string[] {
 const sums=clubs.map(c=>c.roster.map(k=>Object.values(players[k]!.abilities).reduce((a,b)=>a+b,0)).sort((a,b)=>b-a).slice(0,5).reduce((a,b)=>a+b,0)),sum=sums.reduce((a,b)=>a+b,0);
 return clubs.filter((_,i)=>sums[i]!*100<sum*9 || sums[i]!*100>sum*11).map(c=>c.id);
}
/** Career pro-world foundation. No protagonist placement, recruitment, match or contract acceptance occurs here. */
export function createKboRosterWorld(input:{worldKey:string;seasonKey:string;seed:string;difficulty:Difficulty}):KboRosterWorld {
 if(!input.worldKey || !input.seasonKey || !input.seed || !['GROWTH','REALISTIC','SECRET_CHEAT'].includes(input.difficulty))throw new RangeError('INVALID_KBO_WORLD');
 const namespace=JSON.stringify(['kbo-roster-1',input.worldKey]);
 let roster=createWorldStream(input.seed,namespace,'roster'),potential=createWorldStream(input.seed,namespace,'potential');
 const clubs:KboClub[]=KBO_CLUBS.map(c=>({...c,roster:[],firstTeam:[],budgetWon:KBO_MONEY.annualBudgetWon,paidSalaryWon:0,reservedSalaryWon:0})).sort((a,b)=>a.id<b.id?-1:1);
 const templates=clubs.flatMap(c=>[...H_POSITIONS.map((position,i)=>({simulationKey:JSON.stringify(['kbo',c.id,'H',i]),kind:'HITTER' as const,position})),...P_POSITIONS.map((position,i)=>({simulationKey:JSON.stringify(['kbo',c.id,'P',i]),kind:'PITCHER' as const,position}))]);
 const identity=generateNpcIdentities(templates,createWorldStream(input.seed,namespace,'handedness'));
 const identities=new Map(identity.players.map(p=>[p.simulationKey,p]));const players=dict<DevelopmentPlayer>(),repertoires=dict<Repertoire>(),contracts=dict<KboInitialContract>();
 for(const [i,club] of clubs.entries())club.roster=templates.slice(i*50,(i+1)*50).map(p=>p.simulationKey).sort();
 const ages=new Map<string,number>();
 for(const club of clubs){
  // Largest-remainder ties follow bucket order:10/18/15/7 players, then shuffle across roles.
  const ageList:number[]=[];for(const [min,max,count] of [[19,22,10],[23,27,18],[28,32,15],[33,38,7]])for(let i=0;i<count!;i++){const d=nextInteger(roster,max!-min!+1);roster=d.state;ageList.push(min!+d.value);}
  for(let i=ageList.length-1;i>0;i--){const d=nextInteger(roster,i+1);roster=d.state;[ageList[i],ageList[d.value]]=[ageList[d.value]!,ageList[i]!];}
  club.roster.forEach((key,i)=>ages.set(key,ageList[i]!));
 }
 const surnames=['강','고','권','김','남','문','박','백','서','송','신','안','오','유','이','정'],given=['건우','도윤','민준','서준','시우','예준','우진','윤호','재민','정우','준서','지호','태윤','하준','현우','지훈','도현','승우','준우','선우','민재','서진','은우','정민','유찬','재윤','성민','지완','수호','태민','준혁','주원'];
 const names=new Map(identity.players.map((p,i)=>[p.simulationKey,surnames[Math.floor(i/32)]!+given[i%32]!]));
 const generate=(npc:NpcIdentity)=>{
  const types=Object.keys(npc.kind==='HITTER'?HITTER_TYPES:PITCHER_TYPES),t=nextInteger(roster,types.length);roster=t.state;const archetype=types[t.value]!,type=archetypeFor(npc.kind,archetype),keys=abilityKeys(npc.kind);
  const draw=nextFloat(roster);roster=draw.state;const u=draw.value,target=Math.round(u<.4?35+Math.sqrt(u*50*20):85-Math.sqrt((1-u)*50*30)),abilities=kboInitialAbilities(npc.kind,archetype,target);
  const p=generateNpcPotential(npc.kind,abilities,{mode:'CAREER',difficulty:input.difficulty,owned:false},potential);potential=p.state;
  const focus=[...keys].sort((a,b)=>type.weights[keys.indexOf(b)]!-type.weights[keys.indexOf(a)]! || keys.indexOf(a)-keys.indexOf(b)).slice(0,4);
  const player:DevelopmentPlayer={...npc,name:names.get(npc.simulationKey)!,age:ages.get(npc.simulationKey)!,archetype,focus,abilities,potential:p.potential,careerPeaks:{...abilities},fatigue:0};validateDevelopmentPlayer(player);players[player.simulationKey]=player;
 };
 for(const npc of identity.players)generate(npc);
 let generationAttempts=0,failed=balanced(clubs,players);
 while(failed.length && generationAttempts<100){for(const club of clubs.filter(c=>failed.includes(c.id)))for(const key of club.roster)generate(identities.get(key)!);generationAttempts++;failed=balanced(clubs,players);}
 if(failed.length)throw new RangeError('KBO_GENERATION_BALANCE_FAILED');
 for(const club of clubs){
  const members=club.roster.map(k=>players[k]!),salaries=initialKboSalaries(members);club.firstTeam=selectKboFirstTeamRoster(members);club.reservedSalaryWon=Object.values(salaries).reduce((a,b)=>a+b,0);
  for(const player of members){const years=nextInteger(createWorldStream(input.seed,JSON.stringify(['kbo-contract-1',input.worldKey,player.simulationKey]),'roster'),4).value+1;contracts[player.simulationKey]={contractKey:JSON.stringify(['kbo-initial-contract',input.seasonKey,player.simulationKey]),playerKey:player.simulationKey,clubId:club.id,seasonKey:input.seasonKey,years,annualSalaryWon:salaries[player.simulationKey]!,signingBonusWon:0,status:'ACTIVE'};
   if(player.kind==='PITCHER'){const pitch=nextInteger(roster,6);roster=pitch.state;repertoires[player.simulationKey]=createRepertoire(PITCH_IDS[pitch.value+1]!,input.seasonKey);}
  }
 }
 const world:KboRosterWorld={schemaVersion:1,status:'CREATED',...input,clubs,players,repertoires,contracts,rng:{roster,potential,handedness:identity.state},generationAttempts};assertInitialKboWorld(world);return world;
}
export function assertInitialKboWorld(world:KboRosterWorld):void {
 for(const stream of [world.rng.roster,world.rng.potential,world.rng.handedness])validateRng(stream);
 if(world.schemaVersion!==1 || world.status!=='CREATED' || !world.worldKey || !world.seasonKey || !world.seed || !['GROWTH','REALISTIC','SECRET_CHEAT'].includes(world.difficulty) || world.clubs.length!==10 || new Set(world.clubs.map(c=>c.id)).size!==10 || Object.keys(world.players).length!==500 || Object.keys(world.contracts).length!==500 || Object.keys(world.repertoires).length!==240 || !Number.isSafeInteger(world.generationAttempts) || world.generationAttempts<0 || world.generationAttempts>100)throw new RangeError('INVALID_KBO_WORLD');
 const seen=new Set<string>();
 for(const club of world.clubs){
  if(KBO_CLUBS.find(c=>c.id===club.id)?.name!==club.name || club.roster.length!==50 || new Set(club.roster).size!==50 || club.firstTeam.length!==28 || new Set(club.firstTeam).size!==28 || club.firstTeam.some(k=>!club.roster.includes(k)) || club.budgetWon!==KBO_MONEY.annualBudgetWon || club.paidSalaryWon!==0)throw new RangeError('INVALID_KBO_CLUB');
  const members=club.roster.map(key=>{const player=Object.hasOwn(world.players,key)?world.players[key]:undefined;if(!player || player.simulationKey!==key || seen.has(key))throw new RangeError('INVALID_KBO_REGISTRATION');seen.add(key);validateDevelopmentPlayer(player);return player;});
  if(members.filter(p=>p.kind==='HITTER').length!==26 || members.filter(p=>p.kind==='PITCHER').length!==24)throw new RangeError('INVALID_KBO_ROSTER');
  for(const [min,max,count] of [[19,22,10],[23,27,18],[28,32,15],[33,38,7]])if(members.filter(p=>p.age>=min! && p.age<=max!).length!==count)throw new RangeError('INVALID_KBO_AGE_DISTRIBUTION');
  for(const player of members){const score=overall(player.kind,player.abilities);if(score.sumUnits<35*score.denominator || score.sumUnits>85*score.denominator || score.sumUnits%score.denominator!==0)throw new RangeError('INVALID_KBO_INITIAL_OVERALL');}
  for(const position of new Set([...H_POSITIONS,...P_POSITIONS]))if(members.filter(p=>p.position===position).length!==[...H_POSITIONS,...P_POSITIONS].filter(p=>p===position).length)throw new RangeError('INVALID_KBO_POSITION_DEPTH');
  let salary=0;for(const player of members){const c=Object.hasOwn(world.contracts,player.simulationKey)?world.contracts[player.simulationKey]:undefined;if(!c || c.playerKey!==player.simulationKey || c.clubId!==club.id || c.seasonKey!==world.seasonKey || c.contractKey!==JSON.stringify(['kbo-initial-contract',world.seasonKey,player.simulationKey]) || c.status!=='ACTIVE' || c.signingBonusWon!==0 || !Number.isInteger(c.years) || c.years<1 || c.years>4 || !Number.isSafeInteger(c.annualSalaryWon) || c.annualSalaryWon%10_000!==0 || c.annualSalaryWon<KBO_MONEY.minimumSalaryWon || c.annualSalaryWon>KBO_MONEY.maximumSalaryWon)throw new RangeError('INVALID_KBO_CONTRACT');salary+=c.annualSalaryWon;
   if(player.kind==='PITCHER'){const r=world.repertoires[player.simulationKey];if(!r || r.seasonId!==world.seasonKey)throw new RangeError('INVALID_KBO_REPERTOIRE');validatePitchWeights(r.book,r.weights);}
  }
  if(salary!==club.reservedSalaryWon || salary!==KBO_MONEY.initialPayrollWon)throw new RangeError('INVALID_KBO_PAYROLL');
  const first=club.firstTeam.map(k=>world.players[k]!);if(first.filter(p=>p.kind==='PITCHER').length!==13 || first.filter(p=>p.position==='C').length<2)throw new RangeError('INVALID_KBO_FIRST_TEAM');
  for(const [position,count] of [['SP',5],['RP',6],['CP',2]] as const)if(first.filter(p=>p.position===position).length!==count)throw new RangeError('INVALID_KBO_FIRST_TEAM_ROTATION');
  automaticFieldLineup(first.filter(p=>p.kind==='HITTER').map(player=>({player,available:true,fits:initialPositionFits(player.position),recent:emptyBatting()})),100);
 }
 if(balanced(world.clubs,world.players).length)throw new RangeError('INVALID_KBO_BALANCE');
}
