import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '@playball/engine';
import {completedHighSchoolCareer} from '../../../packages/engine/test/fixtures.js';
import {careerFlowScreen,flowApplies} from '../src/career-flow-screen.js';

function preparation(){
 let c=completedHighSchoolCareer(10000);
 c=engine.acknowledgeHighSchoolSeasonReview(c,c.revision);
 c=engine.openHighSchoolCareerRoute(c,c.revision,1).career;
 c=engine.prepareCareerKboDraft(c,c.revision);
 c=engine.resolveCareerKboDraft(c,c.revision,1);
 return engine.startCareerPreparation(c,c.revision,1);
}
test('independent preseason stays available and exposes its own command',()=>{
 const c=preparation(),state={schemaVersion:1,career:c};
 assert.equal(flowApplies(state),true);
 assert.equal(careerFlowScreen(state).commands[0]?.type,'CAREER_AMATEUR_PREP_PRESEASON');
});
