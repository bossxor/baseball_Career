import {canonicalJson} from './game.js';
import {assertUsDirect,assertUsRecruitmentWorld} from './us-direct.js';
import type {UsDirectProgram,UsRecruitmentWorld} from './us-direct.js';

/** Reservation inventory, not active league registration or paid personal income. */
export interface UsReservationLedger {
 schemaVersion:1;initialWorld:UsRecruitmentWorld;currentWorld:UsRecruitmentWorld;entries:readonly UsDirectProgram[];
}
function apply(world:UsRecruitmentWorld,p:UsDirectProgram):UsRecruitmentWorld {
 assertUsDirect(world,p);if(p.decision!=='SIGNED' || !p.signing)throw new RangeError('US_SIGNING_REQUIRED');
 const s=p.signing,c=world.clubs.find(c=>c.id===s.offer.clubId)!,next=structuredClone(world);
 next.clubs=world.clubs.map(club=>club.id!==c.id?{...club}:{...club,rookieSlots:club.rookieSlots-Number(s.offer.initialLevel==='ROOKIE'),aSlots:club.aSlots-Number(s.offer.initialLevel==='A'),availableBudgetUsd:s.availableBudgetAfterUsd});
 next.registeredPlayerKeys=[...world.registeredPlayerKeys,s.playerKey].sort();return next;
}
export function createUsReservationLedger(world:UsRecruitmentWorld):UsReservationLedger {
 assertUsRecruitmentWorld(world);
 return {schemaVersion:1,initialWorld:structuredClone(world),currentWorld:structuredClone(world),entries:[]};
}
export function assertUsReservationLedger(ledger:UsReservationLedger):void {
 if(ledger.schemaVersion!==1)throw new RangeError('INVALID_US_RESERVATIONS');
 assertUsRecruitmentWorld(ledger.initialWorld);
 let world=structuredClone(ledger.initialWorld);const seen=new Set<string>();
 for(const p of ledger.entries){const key=p.signing?.receiptKey;if(!key || seen.has(key))throw new RangeError('INVALID_US_RESERVATION_RECEIPT');world=apply(world,p);seen.add(key);}
 if(canonicalJson(world)!==canonicalJson(ledger.currentWorld))throw new RangeError('US_RESERVATION_TOTAL_MISMATCH');
}
/** Source inventory must still match. An identical receipt retry is a no-op, including after JSON restore. */
export function reserveUsDirectSigning(source:UsReservationLedger,p:UsDirectProgram):UsReservationLedger {
 assertUsReservationLedger(source);if(p.decision!=='SIGNED' || !p.signing)throw new RangeError('US_SIGNING_REQUIRED');
 const prior=source.entries.find(e=>e.signing!.receiptKey===p.signing!.receiptKey);
 if(prior){if(canonicalJson(prior)!==canonicalJson(p))throw new RangeError('US_RESERVATION_REUSED');return structuredClone(source);}
 const next={...structuredClone(source),currentWorld:apply(source.currentWorld,p),entries:[...structuredClone(source.entries),structuredClone(p)]};assertUsReservationLedger(next);return next;
}
