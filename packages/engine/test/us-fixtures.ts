import {createSeasonCalendar} from '../src/season-calendar.js';
import type {CalendarVersion} from '../src/season-calendar.js';
import assert from 'node:assert/strict';
import {completedHighSchoolCareer} from './fixtures.js';
import {acknowledgeHighSchoolSeasonReview,openHighSchoolCareerRoute} from '../src/high-school-route.js';
import {prepareCareerUsDirect,careerUsDirectView,decideCareerUsDirect} from '../src/career-us.js';
import {createUsRosterWorld} from '../src/us-world.js';
import {initialUsRecruitmentInventory} from '../src/us-inventory.js';
import {closeSchoolSeasonForUs} from '../src/us-entry.js';
import {startSignedUsCareer} from '../src/us-career-entry.js';
import {setUsPreseasonArchetype,unreadUsFirstCampNotices,resolveUsFirstCampNotice,confirmUsPreseasonPlan} from '../src/us-preseason.js';
import {publishUsSeasonSchedule} from '../src/us-schedule.js';
const cache=new Map<string,ReturnType<typeof fixture>>();
function fixture(kind:'HITTER'|'PITCHER'){
 const hs=completedHighSchoolCareer(800_000,kind),review=acknowledgeHighSchoolSeasonReview(hs,hs.revision),open=openHighSchoolCareerRoute(review,review.revision,1).career,world=createUsRosterWorld({worldKey:open.world.worldKey,seasonKey:String(open.world.calendar!.year+1),seed:open.world.seed,difficulty:open.difficulty,organizations:Array.from({length:30},(_,i)=>({id:'US'+String(i+1).padStart(2,'0'),name:'가상미국조직'+(i+1)}))}),inventory=initialUsRecruitmentInventory(world,world.organizations.map(o=>({organizationId:o.id,rookieCapacity:23,aCapacity:23,availableBudgetUsd:3_000_000,nationalReleaseAllowed:true,militaryReturnOption:false}))),prepared=prepareCareerUsDirect(open,open.revision,inventory),offers=careerUsDirectView(prepared);assert.ok(offers.visible);assert.ok(offers.offers.length);
 const signed=decideCareerUsDirect(prepared,prepared.revision,{programVersion:1,decision:{type:'SIGN',offerKey:offers.offers[0]!.offerKey},eventVersion:1});return {signed,world};
}
function ready(kind:'HITTER'|'PITCHER'){if(!cache.has(kind))cache.set(kind,fixture(kind));return structuredClone(cache.get(kind)!);}


export function activeUsCareer(kind:'HITTER'|'PITCHER'){const {signed,world}=ready(kind),closed=closeSchoolSeasonForUs(signed,signed.revision,true);return startSignedUsCareer(closed,closed.revision,world);}

export function preparedUsCareer(kind:'HITTER'|'PITCHER'='HITTER',calendarVersion?:CalendarVersion){
 let c=activeUsCareer(kind);if(calendarVersion)c.world.calendar=createSeasonCalendar(Number(c.world.seasonKey),calendarVersion);c=setUsPreseasonArchetype(c,c.revision,c.world.players[c.protagonistKey]!.archetype);const e=unreadUsFirstCampNotices(c)[0]!;c=resolveUsFirstCampNotice(c,c.revision,{eventKey:e.eventKey,eventVersion:e.eventVersion,command:'ACK_EVENT'});c=confirmUsPreseasonPlan(c,c.revision);return publishUsSeasonSchedule(c,c.revision);
}
