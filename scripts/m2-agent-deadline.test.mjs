import assert from 'node:assert/strict';
import test from 'node:test';
import {enteredKboCareer} from '../packages/engine/test/fixtures.ts';
import {confirmKboPreseasonPlan} from '../packages/engine/src/kbo-preseason.ts';
import {confirmKboOpeningRoster} from '../packages/engine/src/kbo-opening-roster.ts';
import {confirmKboSeasonSchedule} from '../packages/engine/src/kbo-schedule.ts';
import {startKboRegularSeason} from '../packages/engine/src/kbo-progress.ts';
import {offerKboRenewal} from '../packages/engine/src/kbo-renewal.ts';
import {careerSalaryCounterPreview,hireCareerAgent,requestCareerSalaryCounter} from '../packages/engine/src/career-agent.ts';

test('P15 finite renewal deadline rejects a late counter without spending the draw',()=>{
 let career=enteredKboCareer();
 for(const apply of [confirmKboPreseasonPlan,confirmKboOpeningRoster,confirmKboSeasonSchedule,startKboRegularSeason]){
  career=apply(career,career.revision);
 }
 const day=300;
 // Controlled dates isolate the deadline rule. Actual E30 issuance leaves the deadline null.
 career.phaseContext={phase:'SEASON_REVIEW'};
 career.days.days=[{day,evidence:'controlled-close',result:{injured:[],recovered:[]}}];
 career.seasonClose={receiptKey:'controlled-close',seasonKey:career.world.seasonKey,sourceRevision:career.revision,agingLossUnits:0,trainingForfeited:true};
 career=hireCareerAgent(career,career.revision,'AG01');
 career=offerKboRenewal(career,career.revision);
 const event=career.events.find(e=>e.eventKey===career.renewal.eventKey);
 assert.equal(event.deadlineWorldDay,null);
 event.deadlineWorldDay=day;
 const preview=careerSalaryCounterPreview(career);
 assert.equal(preview.deadlineWorldDay,day);
 const option=preview.options.find(o=>o.eligible);
 assert.ok(option);
 const input={previewId:preview.previewId,raiseBps:option.raiseBps};
 const onTime=requestCareerSalaryCounter(career,career.revision,input);
 assert.equal(onTime.agents.salaryRequests.length,1);
 assert.notDeepEqual(onTime.agents.negotiationRng,career.agents.negotiationRng);
 const late=structuredClone(career);
 late.days.days[0].day=day+1;
 const before=structuredClone(late);
 assert.throws(()=>requestCareerSalaryCounter(late,late.revision,input),/AGENT_SALARY_OFFER_NOT_AVAILABLE/);
 assert.deepEqual(late,before);
});
