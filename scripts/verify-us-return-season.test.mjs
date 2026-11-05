import test from 'node:test';
import assert from 'node:assert/strict';
import {continuationChoice,verifyUsReturnSeason} from './verify-us-return-season.mjs';
test('US continuation uses explicit native owners and refuses unknown decisions',()=>{
 assert.deepEqual(continuationChoice('E43'),['WINDOW','FORFEIT_TRAINING']);
 assert.deepEqual(continuationChoice('E60'),['LEVEL','CONFIRM_CALLUP']);
 assert.deepEqual(continuationChoice('E84'),['HIDDEN','OPEN_TRAITS']);
 assert.throws(()=>continuationChoice('E66'),/UNHANDLED_US_CONTINUATION_EVENT/);
 assert.throws(()=>verifyUsReturnSeason('',''),/PATHS_REQUIRED/);
});
