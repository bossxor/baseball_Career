import {recordTotals} from './records.js';
import type {RecordLedger,RecordScope} from './records.js';
import {evaluateTraitUnlocks,validateTraits,TRAIT_IDS} from './traits.js';
import type {TraitOwnership,TraitId} from './traits.js';
import type {HighSchoolCareer} from './high-school-career.js';

export interface TraitUnlockReceipt {playerKey:string;traitId:TraitId;worldDay:number;recordRevision:number;seasonKey?:string;leagueKey?:string}
export interface CareerTraitLedger {schemaVersion:1;owned:Record<string,TraitOwnership>;unlocks:readonly TraitUnlockReceipt[];lastClosedDay:number|null;lastSeasonKey?:string}

const empty=():TraitOwnership=>({unlocked:[],qualifiedRivalPitcherKeys:[]});
export const createCareerTraitLedger=():CareerTraitLedger=>({schemaVersion:1,owned:Object.create(null) as Record<string,TraitOwnership>,unlocks:[],lastClosedDay:null});

/** Official contributions only. Season counts never mix leagues/phases; career counts add every official scope. */
function evidenceFor(records:RecordLedger,seasonKey:string,leagueKey:string,playerKey:string) {
 const regular=recordTotals(records,{leagueKey,phase:'REGULAR',seasonKey});
 const b=regular.batting[playerKey],p=regular.pitching[playerKey];
 const scopes=new Map<string,{leagueKey:string;phase:RecordScope['phase']}>();
 for(const g of Object.values(records.games))scopes.set(JSON.stringify([g.scope.leagueKey,g.scope.phase]),{leagueKey:g.scope.leagueKey,phase:g.scope.phase});
 const career={extraHomeSuccesses:0,fieldingGames:0,loadedHits:0,postseasonHR:0,saves:0,loadedBF:0,walkoffHits:0,shutouts:0,consecutiveQualifiedSeasons:0};
 for(const scope of scopes.values()) {
  const t=recordTotals(records,scope),cb=t.batting[playerKey],cp=t.pitching[playerKey];
  if(cb){career.extraHomeSuccesses+=cb.extraHomeSuccesses;career.fieldingGames+=cb.fieldingGames;career.loadedHits+=cb.loadedHits;career.walkoffHits+=cb.walkoffHits;if(scope.phase==='POSTSEASON')career.postseasonHR+=cb.HR;}
  if(cp){career.saves+=cp.SV;career.loadedBF+=cp.loadedBF;career.shutouts+=cp.shutouts;}
 }
 // T16 needs five consecutive qualified seasons; a single high-school season cannot provide that history yet.
 return {
  regular:{PA:b?.PA??0,extraBaseHits:b?b.twoB+b.threeB+b.HR:0,BB:b?.BB??0,K:p?.K??0,outs:p?.outs??0,starts:p?.starts??0},
  career,
  // Rival relationships are not generated yet; T14 targets stay empty instead of inventing evidence.
  qualifiedRivalPitcherKeys:[] as string[],
 };
}

/** Runs once per closed school day after every game of that date is FINAL. A team plays at most one game per day,
 * so new traits apply from each player's next game snapshot and never change a committed game. */
export function refreshCareerTraits(source:HighSchoolCareer,closedDay:number):CareerTraitLedger {
 const ledger=structuredClone(source.traits??createCareerTraitLedger());
 if(ledger.schemaVersion!==1 || !Number.isSafeInteger(closedDay))throw new RangeError('INVALID_TRAIT_LEDGER');
 // M2-V college saves carry an HS cursor without a season tag; college play did not exist yet.
 const sameSeason=ledger.lastSeasonKey===source.world.seasonKey || ledger.lastSeasonKey===undefined && source.world.leagueKey!=='COLLEGE';
 if(sameSeason && ledger.lastClosedDay!==null && closedDay<=ledger.lastClosedDay)return ledger;
 const leagueKey=source.world.leagueKey??'HS';
 const played=new Set<string>();
 for(const g of Object.values(source.records.games))if(g.scope.seasonKey===source.world.seasonKey && g.scope.leagueKey===leagueKey && (g.scope.phase==='REGULAR' || g.scope.phase==='POSTSEASON') && g.worldDay<=closedDay){for(const k of Object.keys(g.batting))played.add(k);for(const k of Object.keys(g.pitching))played.add(k);}
 for(const key of [...played].sort()) {
  const player=source.world.players[key];if(!player)continue;
  const before=Object.hasOwn(ledger.owned,key)?ledger.owned[key]!:empty();
  const after=evaluateTraitUnlocks(player.kind,player.abilities,before,evidenceFor(source.records,source.world.seasonKey,leagueKey,key));
  const added=after.unlocked.filter(id=>!before.unlocked.includes(id));
  if(added.length===0)continue;
  ledger.owned[key]=after;
  ledger.unlocks=[...ledger.unlocks,...added.map(traitId=>({playerKey:key,traitId,worldDay:closedDay,recordRevision:source.records.revision,seasonKey:source.world.seasonKey,leagueKey}))];
 }
 ledger.lastClosedDay=closedDay;
 ledger.lastSeasonKey=source.world.seasonKey;
 return ledger;
}

export function validateCareerTraitLedger(ledger:CareerTraitLedger,kinds:Readonly<Record<string,{kind:'HITTER'|'PITCHER'}>>):void {
 if(ledger.schemaVersion!==1)throw new RangeError('INVALID_TRAIT_LEDGER');
 for(const [key,owned] of Object.entries(ledger.owned)){const p=kinds[key];if(!p)throw new RangeError('INVALID_TRAIT_LEDGER');validateTraits(p.kind,owned);}
 const seen=new Set<string>();
 for(const r of ledger.unlocks){const id=r.playerKey+':'+r.traitId;if(seen.has(id) || !TRAIT_IDS.includes(r.traitId) || !ledger.owned[r.playerKey]?.unlocked.includes(r.traitId))throw new RangeError('INVALID_TRAIT_LEDGER');seen.add(id);}
}
