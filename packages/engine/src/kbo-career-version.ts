import type {KboCareer} from './kbo-career-entry.js';
import {assertCareerRevision} from './high-school-career.js';

/** KBO v2 introduced ACTIVE. v3 adds mandatory plans and return conditioning. v4 adds midseason transfers. School/v1 guards remain unchanged. */
export function assertKboCareerRevision(source:Pick<KboCareer,'schemaVersion'|'revision'> & Partial<Pick<KboCareer,'transferHistory'|'world'>>,expectedRevision:number):void {
 if(![1,2,3,4].includes(source.schemaVersion))throw new RangeError('CAREER_REVISION_CHANGED');
 if(source.schemaVersion!==4 && ((source.transferHistory?.length??0)>0 || Object.values(source.world?.contracts??{}).some(c=>c.remainderPay?.schemaVersion===2)))throw new RangeError('CAREER_REVISION_CHANGED');
 assertCareerRevision({schemaVersion:1,revision:source.revision},expectedRevision);
}
