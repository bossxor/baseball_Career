import type {KboCareer} from './kbo-career-entry.js';
import type {UsCareer} from './us-career-entry.js';
import {assertKboCareerRevision} from './kbo-career-version.js';
import {assertUsCareerRevision} from './us-career-entry.js';
import {validateCareerTraitLedger} from './high-school-traits.js';
import type {TraitUnlockReceipt} from './high-school-traits.js';

type ProCareer=KboCareer|UsCareer;
const HIDDEN=new Set(['T13','T14','T15','T16']);
const isUs=(c:ProCareer):c is UsCareer=>'mode' in c&&c.mode==='US_CAREER';

function sourceReceipts(c:ProCareer,revision:number):readonly TraitUnlockReceipt[] {
 if(!Number.isSafeInteger(revision)||revision<1||c.revision!==revision)throw new RangeError('PRO_TRAIT_SUMMARY_REVISION_CHANGED');
 if(!c.world||!c.world.players||!c.registration||!c.records||!Number.isSafeInteger(c.records.revision)||c.records.revision<0)throw new RangeError('INVALID_PRO_TRAIT_SUMMARY_SOURCE');
 if(isUs(c))assertUsCareerRevision(c,revision);else assertKboCareerRevision(c,revision);
 const key=c.protagonistKey,registration=c.registration,world=!isUs(c)&&c.preparationSeason?c.preparationSeason.world:c.world,player=world.players[key];
 if(!key||!player||player.simulationKey!==key||registration.playerKey!==key||registration.seasonKey!==c.world.seasonKey||registration.clubId!==(isUs(c)?c.protagonistOrganizationId:c.protagonistClubId))throw new RangeError('INVALID_PRO_TRAIT_SUMMARY_SOURCE');
 const ledger=c.traits;if(!ledger)return [];
 const cursor=ledger.summaryCursor??0;
 if(!Array.isArray(ledger.unlocks)||ledger.unlocks.some(r=>!r||typeof r!=='object')||!ledger.owned||typeof ledger.owned!=='object'||Array.isArray(ledger.owned)||!Number.isSafeInteger(cursor)||cursor<0||cursor>ledger.unlocks.length)throw new RangeError('INVALID_PRO_TRAIT_SUMMARY');
 const ownership=ledger.owned[key];
 if(Object.hasOwn(ledger.owned,key)&&(!ownership||!Array.isArray(ownership.unlocked)||!Array.isArray(ownership.qualifiedRivalPitcherKeys)))throw new RangeError('INVALID_TRAIT_LEDGER');
 const receipts=ledger.unlocks.filter(r=>r.playerKey===key),owned=Object.hasOwn(ledger.owned,key)?{[key]:ledger.owned[key]!}:{};
 // Retired NPC identities may no longer be in the live world; their receipts are not this player's reading surface.
 validateCareerTraitLedger({...ledger,owned,unlocks:receipts},{[key]:player});
 if(receipts.some(r=>!Number.isSafeInteger(r.worldDay)||r.worldDay<0||!Number.isSafeInteger(r.recordRevision)||r.recordRevision<0||r.recordRevision>c.records.revision||r.seasonKey!==undefined&&(!/^\d{4}$/.test(r.seasonKey)||Number(r.seasonKey)>Number(world.seasonKey))||r.leagueKey!==undefined&&(typeof r.leagueKey!=='string'||r.leagueKey.length===0)))throw new RangeError('INVALID_PRO_TRAIT_SUMMARY_EVIDENCE');
 return ledger.unlocks.slice(cursor).filter(r=>r.playerKey===key&&!HIDDEN.has(r.traitId));
}

/** E85 is an unread surface, never a queued world event or a hidden-trait detail response. */
export function unreadProTraitSummary(c:ProCareer):readonly TraitUnlockReceipt[] {
 return sourceReceipts(c,c.revision).map(r=>({playerKey:r.playerKey,traitId:r.traitId,worldDay:r.worldDay,recordRevision:r.recordRevision,...(r.seasonKey===undefined?{}:{seasonKey:r.seasonKey}),...(r.leagueKey===undefined?{}:{leagueKey:r.leagueKey})}));
}

/** Only the summary cursor and root revision change; preparation mirrors share the updated cursor. */
export function acknowledgeProTraitSummary<T extends ProCareer>(source:T,expectedRevision:number):T {
 sourceReceipts(source,expectedRevision);
 const length=source.traits?.unlocks.length??0;
 if(!source.traits||(source.traits.summaryCursor??0)===length)return source;
 if(expectedRevision===Number.MAX_SAFE_INTEGER)throw new RangeError('PRO_TRAIT_SUMMARY_REVISION_CHANGED');
 const traits={...source.traits,summaryCursor:length},next:T={...source,revision:expectedRevision+1,traits};
 if(!isUs(source)&&source.preparationSeason)Object.assign(next,{preparationSeason:{...source.preparationSeason,traits}});
 sourceReceipts(next,next.revision);return next;
}
