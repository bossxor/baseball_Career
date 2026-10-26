import type {PitchId} from '@playball/rules';
import type {HighSchoolCareer} from './high-school-career.js';
import {assertSchoolCareerRevision} from './high-school-career.js';
import {beginPitchLearning,setPitchWeights} from './repertoire.js';
import type {PitchWeights} from './repertoire.js';
import {registerPitchLearning} from './pitch-learning-progress.js';
function ready(c:HighSchoolCareer,revision:number){assertSchoolCareerRevision(c,revision);if(c.phaseContext.phase!=='PRESEASON_SETUP'||c.world.players[c.world.protagonistKey]!.kind!=='PITCHER')throw new RangeError('PITCHER_PRESEASON_REQUIRED');}
export function beginSchoolPreseasonPitchLearning(c:HighSchoolCareer,revision:number,pitchId:PitchId,replacedPitchId?:PitchId):HighSchoolCareer {ready(c,revision);const key=c.world.protagonistKey,next=structuredClone(c),window=JSON.stringify([c.world.seasonKey,'PRE']),book=beginPitchLearning(c.world.repertoires[key]!,pitchId,true,replacedPitchId?{pitchId:replacedPitchId,windowId:window}:undefined),games=c.world.schedule.filter(g=>g.homeTeamKey===c.world.protagonistSchoolId||g.awayTeamKey===c.world.protagonistSchoolId).length;next.world.repertoires[key]=registerPitchLearning(book,c.world.worldKey,key,games,Object.hasOwn(c.health.injuries,key));next.revision++;return next;}
export function setSchoolPreseasonPitchWeights(c:HighSchoolCareer,revision:number,weights:PitchWeights):HighSchoolCareer {ready(c,revision);const next=structuredClone(c),key=c.world.protagonistKey;next.world.repertoires[key]=setPitchWeights(c.world.repertoires[key]!,weights,JSON.stringify([c.world.seasonKey,'PRE']),true);next.revision++;return next;}
