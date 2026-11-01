import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorldEvent,eventDefinition,resolveEventChoice} from '../src/events.js';
import {canonicalJson} from '../src/game.js';

test('M2 E99 catalogue navigation preserves chronicle evidence and enforces context/version/availability; producer remains M7',()=>{
 const definition=eventDefinition('E99');
 assert.equal(definition.evidenceDomain,'CHRONICLE');
 assert.deepEqual(definition.evidenceFields,['momentId','evidenceVersion']);
 assert.deepEqual(definition.choices.find(c=>c.command==='OPEN_CHRONICLE'),{command:'OPEN_CHRONICLE',label:'연대기확인',dispatchClass:'NAVIGATE',targetScreen:'S45'});
 // This is a controlled M7-produced notice boundary, not proof that M2 generates chronicle moments.
 const notice=createWorldEvent({definitionId:'E99',worldKey:'closure-world',seasonKey:'2032',worldDay:140,sourceSequence:1,evidence:{version:1,type:'CHRONICLE',fields:{momentId:'immutable-m7-moment',evidenceVersion:1}},resume:{worldKey:'closure-world',seasonKey:'2032',phase:'SEASON_PROGRESS',competitionKey:'KBO',registrationKey:'club',sourceRevision:12}});
 const context={worldKey:notice.worldKey,seasonKey:notice.seasonKey,worldDay:140,eligibleCommands:notice.offeredChoices},before=canonicalJson(notice);
 const input=JSON.parse(JSON.stringify(notice)),opened=resolveEventChoice(input,1,'OPEN_CHRONICLE',null,context);
 assert.equal(opened.navigation?.targetScreen,'S45');assert.equal(opened.event.status,'RESOLVED');assert.equal(opened.event.resolution?.kind,'NAVIGATE');
 assert.deepEqual(opened.event.evidence,notice.evidence);assert.deepEqual(opened.event.resume,notice.resume);assert.equal(canonicalJson(notice),before);
 assert.throws(()=>resolveEventChoice(notice,2,'OPEN_CHRONICLE',null,context),/VERSION/);
 assert.throws(()=>resolveEventChoice(notice,1,'OPEN_CHRONICLE',null,{...context,worldKey:'another'}),/CONTEXT/);
 assert.throws(()=>resolveEventChoice(notice,1,'OPEN_CHRONICLE',null,{...context,eligibleCommands:[]}),/CHOICE/);
 assert.throws(()=>resolveEventChoice(opened.event,opened.event.version,'OPEN_CHRONICLE',null,context),/RESOLVED/);
 const acknowledged=resolveEventChoice(notice,1,'ACK_EVENT',null,context);assert.equal(acknowledged.event.resolution?.kind,'ACK');assert.equal(canonicalJson(notice),before);
});
