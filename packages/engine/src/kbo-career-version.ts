import type {KboCareer} from './kbo-career-entry.js';
import {assertCareerRevision} from './high-school-career.js';

/** KBO v2 is activated only by explicit ACTIVE confirmation. The unchanged v1 guard blocks old writers. */
export function assertKboCareerRevision(source:Pick<KboCareer,'schemaVersion'|'revision'>,expectedRevision:number):void {
 if(![1,2].includes(source.schemaVersion))throw new RangeError('CAREER_REVISION_CHANGED');
 assertCareerRevision({schemaVersion:1,revision:source.revision},expectedRevision);
}
