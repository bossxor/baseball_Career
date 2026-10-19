// Offseason written examples and screen-command linkage, not runtime execution.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)),json=n=>JSON.parse(fs.readFileSync(path.join(root,n),'utf8'));
const d=json('club-offseason-dependencies.json'),screens=json('screen-state-catalog.json').screens;
assert.equal(d.status,'DESIGN_ONLY');assert.equal(d.executionStatus,'NOT_EXECUTED');assert.equal(d.workGroups.length,8);assert.equal(d.scenarios.length,12);
assert.equal(new Set(d.workGroups.map(g=>g.id)).size,8);assert.equal(new Set(d.scenarios.map(s=>s.id)).size,12);
for(const g of d.workGroups){assert.equal(g.executionStatus,'NOT_EXECUTED');for(const id of g.screenIds)assert.ok(screens.some(s=>s.id===id));}
for(const c of d.scenarios)assert.equal(c.executionStatus,'NOT_EXECUTED');
assert.equal(d.ordering.suggestedReviewOrderIsMandatorySchedule,false);assert.equal(d.ordering.singleActiveBlockingTask,true);assert.equal(d.ordering.optionalOperationsBlockYear,false);
const sorted=d.deadlineExample.tasks.slice().sort((a,b)=>a.deadlineDay-b.deadlineDay||a.phaseOrder-b.phaseOrder||a.sourceSequence-b.sourceSequence);assert.equal(sorted[0].id,d.deadlineExample.expectedFirst);
const f=d.futureBudget;assert.equal(f.annualBase*f.capNumerator/f.capDenominator,f.cap);assert.equal(f.cap,10800000000);
for(const c of f.examples)assert.equal((c.total??f.currentGuaranteed+c.added)<=f.cap,c.passesFutureCap);
assert.equal(f.passesOtherGatesAutomatically,false);assert.equal(d.year.carryUnspentBudget,false);assert.notEqual(d.year.newBase+d.year.previousAvailable,d.year.newBase);
assert.equal(d.year.pendingMandatoryTasks,1);assert.equal(d.year.expectedTransitionJobs,0);assert.equal(d.year.duplicateTargetSeasonJobs,false);
assert.equal(d.draft.baseRookies,d.draft.teams*d.draft.rounds);assert.equal(d.draft.atCapacity,'PAUSE_AND_REPAIR_SAME_PICK');assert.equal(d.draft.careerNominationProbabilityApplied,false);assert.equal(d.rounds.unconditionalThreeRoundProbabilityAvailable,false);
const b=json('screen-action-bindings.json').screens.find(s=>s.screenId==='S18');assert.equal(b.actionClass,'MIXED');assert.equal(b.actionClasses.READ_LEAGUE_RECORDS,'QUERY');
for(const command of ['CLUB_DRAFT_PICK','CLUB_DRAFT_AUTO_PICK']){assert.ok(b.actions.includes(command));assert.equal(b.actionClasses[command],'SAVE_COMMAND');}
assert.equal(b.commandContext.mode,'CLUB');assert.equal(b.commandContext.requiresCurrentTurn,true);assert.equal(b.commandContext.requiresDraftVersion,true);assert.equal(b.conditionalQueries.CLUB_DRAFT,'clubDraftState');
assert.equal(json('screen-recovery-matrix.json').screens.find(s=>s.screenId==='S18').navigationPolicy,'MIXED');
assert.equal(screens.length,45);assert.equal(json('event-catalog-v2.json').events.length,99);
console.log('PASS: offseason 8 groups / 12 collision cases, deadline ordering and future-budget edges; S18 draft query/commands separated. Real draft/market/year transition remains NOT_EXECUTED.');
