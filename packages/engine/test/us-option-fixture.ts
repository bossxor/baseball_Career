import type {UsCareer} from '../src/us-career-entry.js';
import {completedHighSchoolCareer} from './fixtures.js';
import {acknowledgeHighSchoolSeasonReview,openHighSchoolCareerRoute} from '../src/high-school-route.js';
import {prepareCareerUsDirect,careerUsDirectView,decideCareerUsDirect} from '../src/career-us.js';
import {createUsRosterWorld} from '../src/us-world.js';
import {initialUsRecruitmentInventory} from '../src/us-inventory.js';
import {closeSchoolSeasonForUs} from '../src/us-entry.js';
import {startSignedUsCareer} from '../src/us-career-entry.js';
import {setUsPreseasonArchetype,confirmUsPreseasonPlan,unreadUsFirstCampNotices,resolveUsFirstCampNotice} from '../src/us-preseason.js';
import {publishUsSeasonSchedule} from '../src/us-schedule.js';
import {finishedUsCareerFixture} from './us-finished-fixture.js';

/** The existing option is negotiated by actual recruitment/signing/activation commands. */
export function preparedUsOptionCareer(kind:'HITTER'|'PITCHER'='PITCHER'):UsCareer {
 const hs=completedHighSchoolCareer(800_000,kind),review=acknowledgeHighSchoolSeasonReview(hs,hs.revision),open=openHighSchoolCareerRoute(review,review.revision,1).career;
 const world=createUsRosterWorld({worldKey:open.world.worldKey,seasonKey:String(open.world.calendar!.year+1),seed:open.world.seed,difficulty:open.difficulty,organizations:Array.from({length:30},(_,i)=>({id:'US'+String(i+1).padStart(2,'0'),name:'US'+String(i+1).padStart(2,'0')}))});
 const inventory=initialUsRecruitmentInventory(world,world.organizations.map(o=>({organizationId:o.id,rookieCapacity:23,aCapacity:23,availableBudgetUsd:3_000_000,nationalReleaseAllowed:true,militaryReturnOption:true}))),prepared=prepareCareerUsDirect(open,open.revision,inventory),offer=careerUsDirectView(prepared).offers[0]!;
 const signed=decideCareerUsDirect(prepared,prepared.revision,{programVersion:1,decision:{type:'SIGN',offerKey:offer.offerKey},eventVersion:1}),closed=closeSchoolSeasonForUs(signed,signed.revision,true);let career=startSignedUsCareer(closed,closed.revision,world);
 career=setUsPreseasonArchetype(career,career.revision,career.world.players[career.protagonistKey]!.archetype);const event=unreadUsFirstCampNotices(career)[0]!;career=resolveUsFirstCampNotice(career,career.revision,{eventKey:event.eventKey,eventVersion:event.eventVersion,command:'ACK_EVENT'});career=confirmUsPreseasonPlan(career,career.revision);return publishUsSeasonSchedule(career,career.revision);
}

/** Closed regular/PS contribution rows are controlled fixtures, not native competitive seasons. */
export function closedUsOptionCareer(kind:'HITTER'|'PITCHER'='PITCHER'):UsCareer {return finishedUsCareerFixture(preparedUsOptionCareer(kind));}
