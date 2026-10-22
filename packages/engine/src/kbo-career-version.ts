import type {KboCareer} from './kbo-career-entry.js';
import {assertCareerRevision} from './high-school-career.js';

/** KBO v2 introduced ACTIVE. v3 adds mandatory plans and return conditioning. School/v1 guards remain unchanged. */
export function assertKboCareerRevision(source:Pick<KboCareer,'schemaVersion'|'revision'>,expectedRevision:number):void {
 if(![1,2,3].includes(source.schemaVersion))throw new RangeError('CAREER_REVISION_CHANGED');
 assertCareerRevision({schemaVersion:1,revision:source.revision},expectedRevision);
}
