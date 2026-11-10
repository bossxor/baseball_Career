import test from 'node:test';
import assert from 'node:assert/strict';
import {controlledDeclinedUsReturn} from './us-return-retirement-fixture.js';
import {canonicalJson} from '../src/game.js';
import {assertUsAmateurReturnCareer,prepareUsAmateurReturnDraft} from '../src/us-amateur-return-career.js';
import {requestUsReturnRetirement,resolveUsReturnRetirement,openUsReturnArchive,usReturnRetirementView} from '../src/us-return-retirement.js';

test('controlled completed return: E36 cancel/re-request, E37 archive preserve source/draft/return/retry without charge',()=>{
 const source=controlledDeclinedUsReturn(),before=canonicalJson(source);
 const first=requestUsReturnRetirement(source,source.revision),event=first.events.at(-1)!;
 assert.throws(()=>requestUsReturnRetirement(source,source.revision-1),/REVISION/);
 assert.throws(()=>prepareUsAmateurReturnDraft(first,first.revision),/RETIREMENT_PENDING/);
 const input={eventKey:event.eventKey,eventVersion:event.version,command:'CANCEL_RETIRE' as const};
 assert.throws(()=>resolveUsReturnRetirement(first,first.revision,{...input,eventKey:'foreign'}),/NOT_PENDING/);
 assert.throws(()=>resolveUsReturnRetirement(first,first.revision,{...input,eventVersion:0}));
 const cancelled=resolveUsReturnRetirement(first,first.revision,input),second=requestUsReturnRetirement(cancelled,cancelled.revision),e=second.events.at(-1)!;
 assert.notEqual(e.eventKey,event.eventKey);assert.equal(usReturnRetirementView(cancelled),null);
 const archived=resolveUsReturnRetirement(second,second.revision,{eventKey:e.eventKey,eventVersion:e.version,command:'CONFIRM_RETIRE'}),view=usReturnRetirementView(archived)!;
 assert.equal(view.status,'ARCHIVED');assert.deepEqual(view.commands,['OPEN_ARCHIVE']);
 for(const field of ['source','draft','return','retry','service'] as const)assert.equal(canonicalJson(archived[field]),canonicalJson(source[field]));
 assert.equal(archived.retry.careerPreparationUsed,0);assert.equal(archived.retry.episodes.length,source.retry.episodes.length);assert.equal(canonicalJson(source),before);
 const opened=openUsReturnArchive(archived,archived.revision,{eventKey:view.eventKey,eventVersion:view.eventVersion});assert.equal(opened.navigation?.targetScreen,'S10');assertUsAmateurReturnCareer(JSON.parse(JSON.stringify(opened.career)));
 assert.throws(()=>openUsReturnArchive(opened.career,opened.career.revision,{eventKey:view.eventKey,eventVersion:view.eventVersion}));
 assert.doesNotMatch(JSON.stringify(view),/"source"|"sourceBasis"|"rng"|"potential"/);
 for(const change of [(c:typeof archived)=>{c.retirement!.receiptKey='forged';},(c:typeof archived)=>{c.events.at(-2)!.worldKey='foreign';},(c:typeof archived)=>{c.events.at(-2)!.resume.sourceRevision--;},(c:typeof archived)=>{c.retirement!.sourceBasis='forged';},(c:typeof archived)=>{const e=c.events.at(-1)!;e.evidence={...e.evidence,fields:{...e.evidence.fields,playerSimulationKey:'foreign'}};}]){const forged=structuredClone(archived);change(forged);assert.throws(()=>assertUsAmateurReturnCareer(forged));}
});
