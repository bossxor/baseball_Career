import test from 'node:test';
import assert from 'node:assert/strict';
import {virtualMlbPostseasonEndDay,kboP12Window} from '../src/kbo-p12-window.js';
import {createSeasonCalendar} from '../src/season-calendar.js';
import {nationalInviteDeadlines,p12ActualWindow} from '../src/national-bracket.js';
import type {KboCareer} from '../src/kbo-career-entry.js';
import {openNationalCallup,resolveKboNationalEvent} from '../src/kbo-national.js';
import {startNationalTournament} from '../src/national-progress.js';

const stub=(seed:string,seasonKey='2027',phase='SEASON_REVIEW',kboEnd=300)=>({
 schemaVersion:1,revision:1,protagonistKey:'own',protagonistClubId:'club',events:[],health:{injuries:{}},
 world:{seed,worldKey:'w1',seasonKey,calendar:createSeasonCalendar(Number(seasonKey))},
 phaseContext:{phase},postseason:{championKey:'X'},days:{days:[{day:kboEnd}]},
}) as unknown as KboCareer;

test('virtual MLB postseason end day is a pure function of the world seed',()=>{
 const a=virtualMlbPostseasonEndDay(stub('s'));
 assert.equal(a,virtualMlbPostseasonEndDay(stub('s')));
 const base=createSeasonCalendar(2027).growthDays.at(-1)!;
 for(const seed of ['a','b','c','d','e'])assert.ok(virtualMlbPostseasonEndDay(stub(seed))-base>=12&&virtualMlbPostseasonEndDay(stub(seed))-base<=53);
});

test('P12 window follows the later of the KBO and virtual MLB finals and seals both',()=>{
 const c=stub('s'),mlb=virtualMlbPostseasonEndDay(c),w=kboP12Window(c);
 assert.equal(w.basis,'P12_POSTSEASON');
 assert.deepEqual(JSON.parse(w.evidence!).slice(2),[300,mlb]);
 assert.ok(w.startDay>Math.max(300,mlb)-1);
 assert.doesNotThrow(()=>nationalInviteDeadlines(w));
});

test('P12 window requires a completed KBO postseason review',()=>{
 assert.throws(()=>kboP12Window(stub('s','2027','SEASON_PROGRESS')),/NATIONAL_PS_END_REQUIRED/);
});

test('P12 start rejects a supplied window with a substituted MLB final date',()=>{
 const c=stub('s'),mlb=virtualMlbPostseasonEndDay(c);
 const changed=p12ActualWindow(2027,{kboPostseasonEndDay:300,usPostseasonEndDay:mlb+1});
 assert.throws(()=>startNationalTournament(c,c.revision,'P12',changed),/NATIONAL_PS_END_CHANGED/);
});

test('P12 E44 is issued and can be resolved on the authoritative invitation day',()=>{
 const c=stub('s'),window=kboP12Window(c),next=openNationalCallup(c,c.revision,'P12',window);
 const invitation=next.national!.invitations[0]!,event=next.events[0]!;
 assert.equal(event.definitionId,'E44');
 assert.equal(event.occurredWorldDay,invitation.inviteDay);
 assert.ok(event.occurredWorldDay>300);
 const accepted=resolveKboNationalEvent(next,next.revision,{eventKey:event.eventKey,eventVersion:event.version,command:'ACCEPT_NATIONAL'}).career;
 assert.equal(accepted.national!.invitations[0]!.status,'ACCEPTED');
});
