import test from 'node:test';
import assert from 'node:assert/strict';
import {expiredRetryUsCareer} from './us-return-retry-fixture.js';
import {closeControlledServiceDates,usServiceTestStepLimit,usServiceTestProgress} from './us-service-fixture.js';
import {requestUsAmateurReturn,startUsAmateurReturnYear,advanceUsAmateurReturn} from '../src/us-amateur-return-career.js';

test('mandatory return service reports the same season-complete boundary as independent preparation without auto-settling the year',()=>{
 const source=expiredRetryUsCareer();source.military.status='UNRESOLVED';let c=requestUsAmateurReturn(source,source.revision);c=startUsAmateurReturnYear(c,c.revision,c.events.at(-1)!.version);assert.ok(c.service);const year=c.service!.world.seasonKey,last=c.service!.season!.lastDay;
 // Controlled earlier contributions/dates; only the actual final native rest-day close is exercised here.
 c={...c,service:closeControlledServiceDates(c.service!,last-1)};const prior=c.service,stamp=usServiceTestProgress(c.service!),games=Object.values(c.service!.seasonSchedule!.leagues).reduce((n,g)=>n+g.length,0);assert.equal(games,8790);assert.ok(usServiceTestStepLimit(c.service!)>=Math.ceil(games*8/20));assert.ok(Math.ceil(games*8/20)>3000);const block=advanceUsAmateurReturn(c,c.revision);assert.notEqual(usServiceTestProgress(block.career.service!),stamp);assert.equal(block.stopReason,'SERVICE_BLOCK_COMPLETE');assert.equal(block.career.service!.phaseContext.phase,'SEASON_PROGRESS');assert.equal(block.career.return.years.length,0);const result=advanceUsAmateurReturn(block.career,block.career.revision);assert.equal(result.stopReason,'SEASON_COMPLETE');assert.equal(result.career.service!.phaseContext.phase,'SEASON_REVIEW');assert.equal(result.career.service!.season!.days.at(-1)!.day,last);assert.equal(c.service!.season!.days.at(-1)!.day,last-1);assert.equal(result.career.source,c.source);assert.equal(result.career.return.years.length,0);assert.equal(result.career.service!.world.seasonKey,year);assert.equal(result.career.service!.contract.status,'TERMINATED');assert.equal(result.career.service!.season!.paidUsd,0);assert.notEqual(result.career.service,prior);
});
