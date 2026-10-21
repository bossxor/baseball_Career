import {createWorldEvent,resolveEventChoice,eventDefinition} from './events.js';
import type {HighSchoolCareer} from './high-school-career.js';
import type {TraitUnlockReceipt} from './high-school-traits.js';

const HIDDEN=new Set(['T13','T14','T15','T16']);
const assertRevision=(source:HighSchoolCareer,expected:number)=>{if(source.revision!==expected)throw new RangeError('CAREER_REVISION_CHANGED');};
const own=(source:HighSchoolCareer)=>(source.traits?.unlocks??[]).filter(u=>u.playerKey===source.world.protagonistKey);

/** 117 + user decision 2026-10-21: only the first notice of a hidden trait stops progress (E84). Returns null when nothing is due. */
export function raiseHiddenTraitNotice(source:HighSchoolCareer,worldDay:number,resume:HighSchoolCareer['phaseContext']):HighSchoolCareer|null {
 const receipt=own(source).find(u=>HIDDEN.has(u.traitId) && !source.events.some(e=>e.definitionId==='E84' && e.evidence.fields.traitId===u.traitId));
 if(!receipt)return null;
 if(resume.phase!=='SEASON_PROGRESS' && resume.phase!=='SEASON_REVIEW')throw new RangeError('INVALID_NOTICE_RESUME');
 const definition=eventDefinition('E84'),career=structuredClone(source);
 const event=createWorldEvent({definitionId:'E84',worldKey:career.world.worldKey,seasonKey:career.world.seasonKey,
  evidence:{version:1,type:definition.evidenceDomain,fields:{playerSimulationKey:receipt.playerKey,traitId:receipt.traitId,unlockEvidenceVersion:1}},
  resume:{worldKey:career.world.worldKey,seasonKey:career.world.seasonKey,phase:resume.phase,competitionKey:career.world.leagueKey??'HS',registrationKey:career.world.protagonistSchoolId,sourceRevision:career.revision+1},
  sourceSequence:career.events.length+1,worldDay});
 career.events=[...career.events,event];
 career.phaseContext={phase:'EVENT_DECISION',eventKey:event.eventKey,resume:structuredClone(resume) as Extract<HighSchoolCareer['phaseContext'],{phase:'EVENT_DECISION'}>['resume']};
 return career;
}

/** E84 has one NAVIGATE choice (S38). Selecting it resolves the notice and returns to the saved phase. */
export function resolveHiddenTraitNotice(source:HighSchoolCareer,expectedRevision:number,input:{eventKey:string;eventVersion:number;command:string}) {
 assertRevision(source,expectedRevision);const phase=source.phaseContext;
 if(phase.phase!=='EVENT_DECISION' || phase.eventKey!==input.eventKey)throw new RangeError('INVALID_CAREER_PHASE');
 const event=source.events.find(e=>e.eventKey===input.eventKey);if(!event || event.definitionId!=='E84')throw new RangeError('INVALID_TRAIT_NOTICE');
 const selected=resolveEventChoice(event,input.eventVersion,input.command,null,{worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,worldDay:event.occurredWorldDay,eligibleCommands:['OPEN_TRAITS']});
 const career=structuredClone(source);career.events=career.events.map(e=>e.eventKey===event.eventKey?selected.event:e);career.phaseContext=structuredClone(phase.resume);career.revision++;
 return {career,navigation:selected.navigation};
}

/** General unlocks never stop progress; they collect in an unread summary (E85 reading surface). Read-only. */
export function unreadTraitSummary(source:HighSchoolCareer):readonly TraitUnlockReceipt[] {
 const cursor=source.traits?.summaryCursor??0;
 return (source.traits?.unlocks??[]).slice(cursor).filter(u=>u.playerKey===source.world.protagonistKey && !HIDDEN.has(u.traitId));
}
export function acknowledgeTraitSummary(source:HighSchoolCareer,expectedRevision:number):HighSchoolCareer {
 assertRevision(source,expectedRevision);
 const career=structuredClone(source),length=career.traits?.unlocks.length??0;
 if(!career.traits || (career.traits.summaryCursor??0)===length)return career;
 career.traits.summaryCursor=length;career.revision++;return career;
}
