export interface UsConferenceRegistry {version:1;catalogue:'fictional-us-1';AL:string[];NL:string[]}
const AL=Object.freeze(['US01','US03','US05','US07','US09','US11','US13','US15','US17','US19','US21','US23','US25','US27','US29']);
const NL=Object.freeze(['US02','US04','US06','US08','US10','US12','US14','US16','US18','US20','US22','US24','US26','US28','US30']);
const ids=new Set([...AL,...NL]);
export function supportsUsConferenceRegistry(organizations:readonly {id:string}[]):boolean {
 return organizations.length===30&&new Set(organizations.map(o=>o.id)).size===30&&organizations.every(o=>ids.has(o.id));
}
export function createUsConferenceRegistry(organizations:readonly {id:string}[]):UsConferenceRegistry {
 if(!supportsUsConferenceRegistry(organizations))throw new RangeError('UNSUPPORTED_US_CONFERENCE_REGISTRY');
 return {version:1,catalogue:'fictional-us-1',AL:[...AL],NL:[...NL]};
}
export function assertUsConferenceRegistry(value:UsConferenceRegistry,organizations:readonly {id:string}[]):void {
 if(!value||value.version!==1||value.catalogue!=='fictional-us-1'||!supportsUsConferenceRegistry(organizations)||!Array.isArray(value.AL)||!Array.isArray(value.NL)||value.AL.length!==15||value.NL.length!==15||value.AL.some((id,i)=>id!==AL[i])||value.NL.some((id,i)=>id!==NL[i]))throw new RangeError('INVALID_US_CONFERENCE_REGISTRY');
}
