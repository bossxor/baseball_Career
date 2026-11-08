import test from 'node:test';
import assert from 'node:assert/strict';
import {profileStateSize} from './profile-state-size.mjs';

test('state size uses actual serialized bytes with nested Unicode, quotes and escaped strings',()=>{
 const state={career:{season:{days:[{text:'야구"\\'}],openingPlayers:{p:{x:1}}},records:{games:{g:{a:[1,2]}}},health:{games:[]}}};
 const rows=profileStateSize(JSON.stringify(state));
 for(const [path,value] of [['career',state.career],['career.season.days',state.career.season.days],['career.records.games',state.career.records.games],['career.health.games',state.career.health.games]])assert.equal(rows.find(row=>row.path===path).bytes,Buffer.byteLength(JSON.stringify(value)));
});
