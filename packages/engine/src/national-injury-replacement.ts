import type {RecordLedger} from './records.js';
import type {NationalCandidate,NationalSelectionSnapshot} from './national-selection.js';
import {assertNationalSelectionSnapshot,evaluateNationalCandidates,replaceNationalSelectionPlayer} from './national-selection.js';

/** The caller supplies the current same-world population; no generated players or nationality defaults. */
export function replaceNationalInjuryWithEmergency(input:{selection:NationalSelectionSnapshot;worldKey:string;seasonKey:string;seed:string;candidates:readonly NationalCandidate[];records:RecordLedger},playerKey:string,unavailableKeys:ReadonlySet<string>):NationalSelectionSnapshot {
 const {selection,worldKey,seasonKey,seed,records}=input;
 assertNationalSelectionSnapshot(selection);
 if(selection.worldKey!==worldKey||selection.seasonKey!==seasonKey)throw new RangeError('NATIONAL_EMERGENCY_WORLD_MISMATCH');
 if(!unavailableKeys.has(playerKey))throw new RangeError('NATIONAL_INJURY_EVIDENCE_REQUIRED');
 try{return replaceNationalSelectionPlayer(selection,playerKey,unavailableKeys,'INJURED');}
 catch(error){if(!(error instanceof RangeError)||error.message!=='NATIONAL_ROSTER_IMPOSSIBLE')throw error;}
 if(!Array.isArray(input.candidates)||input.candidates.some(c=>!c?.player)||new Set(input.candidates.map(c=>c.player.simulationKey)).size!==input.candidates.length)throw new RangeError('INVALID_NATIONAL_CANDIDATE');
 const known=new Set([...selection.scores.map(s=>s.playerKey),...selection.withdrawnKeys,...unavailableKeys]);
 const candidates=input.candidates.filter(c=>!known.has(c.player.simulationKey));
 const scores=evaluateNationalCandidates({worldKey,seasonKey,seed,tournament:selection.tournament,candidates,records},{selectionId:selection.selectionId,batch:selection.emergencyAdmissions?.length??0,lotRankOffset:Math.max(-1,...selection.scores.map(s=>s.lotRank))+1});
 if(!scores.length)throw new RangeError('NATIONAL_ROSTER_IMPOSSIBLE');
 return replaceNationalSelectionPlayer(selection,playerKey,unavailableKeys,'INJURED',{scores,sourceRecordRevision:records.revision});
}
