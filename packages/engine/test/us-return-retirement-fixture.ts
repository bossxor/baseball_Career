import {expiredRetryUsCareer} from './us-return-retry-fixture.js';
import {closeControlledServiceDates} from './us-service-fixture.js';
import {requestUsAmateurReturn,startUsAmateurReturnYear,settleUsAmateurReturnYear,prepareUsAmateurReturnDraft,resolveUsAmateurReturnDraft,decideUsAmateurReturnDraft,assertUsAmateurReturnCareer} from '../src/us-amateur-return-career.js';
import type {UsAmateurReturnCareer} from '../src/us-amateur-return-career.js';
let cache:UsAmateurReturnCareer|undefined;
/** Controlled US and service date prefixes, NOT native two-year or full M2 evidence. Real draft/retirement commands follow. */
export function controlledDeclinedUsReturn():UsAmateurReturnCareer {
 if(cache)return structuredClone(cache);
 const source=expiredRetryUsCareer();source.military.status='UNRESOLVED';
 let c=requestUsAmateurReturn(source,source.revision);
 for(let year=0;year<2;year++){c=startUsAmateurReturnYear(c,c.revision,c.events.at(-1)!.version);c={...c,service:closeControlledServiceDates(c.service!,c.service!.season!.lastDay)};c=settleUsAmateurReturnYear(c,c.revision);}
 c=prepareUsAmateurReturnDraft(c,c.revision);c=resolveUsAmateurReturnDraft(c,c.revision,c.draft!.program.version);
 if(!c.draft!.program.result!.round)throw Error('CONTROLLED_DECLINED_RETURN_OFFER_REQUIRED');
 c=decideUsAmateurReturnDraft(c,c.revision,c.draft!.program.version,'DECLINE');assertUsAmateurReturnCareer(c);cache=c;return structuredClone(c);
}
