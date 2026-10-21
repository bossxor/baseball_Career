import type {HighSchoolWorld} from './high-school-world.js';
import type {RelationshipLedger,PlayerRelationship} from './relationships.js';

export type RegisteredTeamRelationWorld=Pick<HighSchoolWorld,'worldKey'|'seasonKey'|'protagonistKey'|'protagonistSchoolId'|'schools'|'players'> & {leagueKey?:string};
export interface TeamEntryRelationReceipt {
 entryKey:string;registrationReceiptKey:string;worldKey:string;primaryPlayerKey:string;
 leagueKey:string;teamId:string;seasonKey:string;worldDay:number;otherPlayerKey:string|null;relationKey:string|null;
}
const entryKey=(worldKey:string,primary:string,league:string,team:string)=>JSON.stringify(['team-entry-relation',worldKey,primary,league,team]);
export function assertTeamEntryRelationReceipt(receipt:TeamEntryRelationReceipt):void {
 if(!receipt.worldKey || !receipt.primaryPlayerKey || !receipt.leagueKey || !receipt.teamId || !receipt.seasonKey || !receipt.registrationReceiptKey || !Number.isSafeInteger(receipt.worldDay) || receipt.worldDay<0 || receipt.entryKey!==entryKey(receipt.worldKey,receipt.primaryPlayerKey,receipt.leagueKey,receipt.teamId) || (receipt.otherPlayerKey===null)!==(receipt.relationKey===null) || receipt.otherPlayerKey===receipt.primaryPlayerKey)throw new RangeError('INVALID_TEAM_ENTRY_RELATION');
 if(receipt.otherPlayerKey!==null && receipt.relationKey!==JSON.stringify(['TEAMMATE',JSON.stringify([receipt.primaryPlayerKey,receipt.otherPlayerKey].sort())]))throw new RangeError('INVALID_TEAM_ENTRY_RELATION');
}
export const teamEntryFormationKey=(receipt:TeamEntryRelationReceipt)=>JSON.stringify(['team-entry-formation',receipt.entryKey,receipt.registrationReceiptKey]);
/** Call only from a successful registration transaction. Same team is once per world, not once per season.
 * No RNG or roster mutation. Empty candidates consume the first-entry receipt too. */
export function formRegisteredTeamTeammate(ledger:RelationshipLedger|undefined,world:RegisteredTeamRelationWorld,registrationReceiptKey:string,worldDay:number):RelationshipLedger {
 if(!registrationReceiptKey || !Number.isSafeInteger(worldDay) || worldDay<0)throw new RangeError('INVALID_TEAM_ENTRY_RELATION');
 const me=world.players[world.protagonistKey],team=world.schools.find(t=>t.id===world.protagonistSchoolId),league=world.leagueKey??'HS';
 if(!me || !team || !team.roster.includes(me.simulationKey) || new Set(team.roster).size!==team.roster.length || team.roster.some(k=>!Object.hasOwn(world.players,k)))throw new RangeError('TEAM_REGISTRATION_REQUIRED');
 const key=entryKey(world.worldKey,world.protagonistKey,league,team.id),out:RelationshipLedger=structuredClone(ledger??{schemaVersion:1,relations:[],formation:{rival:'NO_CANDIDATE',teammate:'NO_CANDIDATE'}});
 const seen=new Set<string>();for(const r of out.teamEntries??[]){assertTeamEntryRelationReceipt(r);if(r.worldKey!==world.worldKey || r.primaryPlayerKey!==world.protagonistKey || seen.has(r.entryKey))throw new RangeError('INVALID_TEAM_ENTRY_RELATION');seen.add(r.entryKey);}
 const prior=out.teamEntries?.find(r=>r.entryKey===key);if(prior)return out;
 const other=team.roster.map(k=>world.players[k]!).filter(p=>p.simulationKey!==me.simulationKey && p.kind===me.kind && !out.relations.some(r=>r.type==='TEAMMATE' && r.otherPlayerKey===p.simulationKey)).sort((a,b)=>Math.abs(a.age-me.age)-Math.abs(b.age-me.age) || (a.simulationKey<b.simulationKey?-1:a.simulationKey>b.simulationKey?1:0))[0];
 const normalPairKey=other?JSON.stringify([me.simulationKey,other.simulationKey].sort()):null;
 const receipt:TeamEntryRelationReceipt={entryKey:key,registrationReceiptKey,worldKey:world.worldKey,primaryPlayerKey:me.simulationKey,leagueKey:league,teamId:team.id,seasonKey:world.seasonKey,worldDay,otherPlayerKey:other?.simulationKey??null,relationKey:normalPairKey?JSON.stringify(['TEAMMATE',normalPairKey]):null};assertTeamEntryRelationReceipt(receipt);
 if(other){const relation:PlayerRelationship={relationKey:receipt.relationKey!,type:'TEAMMATE',normalPairKey:normalPairKey!,primaryPlayerKey:me.simulationKey,otherPlayerKey:other.simulationKey,stage:'FORMED',milestones:[{stage:'FORMED',kind:'FORMATION',evidenceKey:teamEntryFormationKey(receipt),worldDay}]};out.relations=[...out.relations,relation];out.formation={...out.formation,teammate:'FORMED'};}
 out.teamEntries=[...(out.teamEntries??[]),receipt];return out;
}
