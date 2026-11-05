import assert from 'node:assert/strict';
import {preparedUsCareer} from './us-fixtures.js';
import {startUsRegularSeason,advanceUsCareer} from '../src/us-season.js';
import type {UsCareer} from '../src/us-career-entry.js';
import type {PlayerRelationship} from '../src/relationships.js';

export function run(c:UsCareer){for(let i=0;i<2000;i++){const r=advanceUsCareer(c,c.revision,1);c=r.career;assert.notEqual(r.stopReason,'ENGINE_LIMIT');if(r.daysClosed)return c;}throw Error('US_REUNION_DAY_LIMIT');}
let cached:{start:UsCareer;end:UsCareer;other:string;gameKey:string}|undefined;
export function fixture(){if(!cached){const p=preparedUsCareer(),start=startUsRegularSeason(p,p.revision);let end=run(start);while(!Object.values(end.records.games).some(g=>g.scope.seasonKey===end.world.seasonKey&&!!g.batting[end.protagonistKey])){Object.assign(start,end);end=run(end);}const g=Object.values(end.records.games).find(g=>g.scope.seasonKey===end.world.seasonKey&&!!g.batting[end.protagonistKey])!,own=end.health.games.find(h=>h.evidence.gameKey===g.gameKey&&h.evidence.roster.includes(end.protagonistKey))!.evidence,other=end.health.games.find(h=>h.evidence.gameKey===g.gameKey&&h.evidence.teamKey!==own.teamKey)!.evidence.appearances.find(a=>!!g.batting[a.playerKey])!.playerKey;cached={start,end,other,gameKey:g.gameKey};}return structuredClone(cached);}
export function relation(c:UsCareer,other:string):PlayerRelationship{const normalPairKey=JSON.stringify([c.protagonistKey,other].sort());return {relationKey:JSON.stringify(['RIVAL',normalPairKey]),normalPairKey,primaryPlayerKey:c.protagonistKey,otherPlayerKey:other,type:'RIVAL',stage:'SEPARATED',milestones:[{stage:'FORMED',evidenceKey:'controlled-formation:'+other,worldDay:0},{stage:'SEPARATED',evidenceKey:'controlled-separation:'+other,worldDay:0}]};}
export function install(c:UsCareer,other:string){const r=relation(c,other);c.relationships.relations=[...c.relationships.relations,r];return r;}
