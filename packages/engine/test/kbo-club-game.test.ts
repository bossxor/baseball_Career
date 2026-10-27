import test from 'node:test';
import assert from 'node:assert/strict';
import {createKboClubGame,kboClubHome,kboClubRoster,kboClubRosterIssues,autoClubLineup,validateClubLineup,fitMultiplier} from '../src/kbo-club-game.js';
import {canonicalJson} from '../src/game.js';

const make=(clubId='LG',extra:{startYear?:number}={})=>createKboClubGame({worldKey:'club-w1',seed:'club-seed-1',difficulty:'REALISTIC',clubId,...extra});

test('club game: whole league from the seed, my club chosen, deterministic, same world for every club choice',()=>{
 const a=make('LG'),b=make('LG'),c=make('HH');
 assert.equal(canonicalJson(a),canonicalJson(b));assert.equal(a.phase,'PRESEASON_SETUP');assert.equal(a.startYear,2027);assert.equal(a.world.seasonKey,'2027');
 assert.equal(canonicalJson(a.world),canonicalJson(c.world),'choosing a club never changes the generated league');
 assert.notEqual(a.creationKey,c.creationKey);
 assert.equal(a.world.clubs.length,10);assert.equal(Object.keys(a.world.players).length,500);assert.equal(a.schedule.KBO.length,720);
 assert.throws(()=>make('NOPE'),/INVALID_KBO_CLUB_GAME/);assert.throws(()=>make('LG',{startYear:1.5}),/INVALID_KBO_CLUB_GAME/);
 assert.ok(make('LG',{startYear:2031}).world.calendar.year===2031);
});

test('home view: ten zero-game standings, my budget, next game and no blocking to-dos at the start',()=>{
 const g=make('LG'),h=kboClubHome(g);
 assert.equal(h.club.id,'LG');assert.equal(h.standings.length,10);assert.ok(h.standings.every(s=>s.games===0));assert.equal(h.standings.filter(s=>s.mine).length,1);
 assert.equal(h.budget.totalWon,12_000_000_000);assert.ok(h.budget.availableWon>0 && h.budget.availableWon<h.budget.totalWon);
 assert.ok(h.nextGame && h.nextGame.opponentKey!=='LG');assert.deepEqual(h.todos,[]);
 const first=g.schedule.KBO.filter(x=>x.homeTeamKey==='LG'||x.awayTeamKey==='LG').sort((p,q)=>p.worldDay-q.worldDay||(p.simulationKey<q.simulationKey?-1:1))[0]!;
 assert.equal(h.nextGame!.worldDay,first.worldDay);
});

test('roster view and issues: first team 28 first, injuries and gaps become blocking to-dos',()=>{
 const g=make('LG'),rows=kboClubRoster(g);
 assert.equal(rows.length,50);assert.equal(rows.filter(r=>r.tier==='FIRST').length,28);assert.ok(rows.slice(0,28).every(r=>r.tier==='FIRST'));
 assert.deepEqual(kboClubRosterIssues(g),[]);
 const hurt=structuredClone(g),club=hurt.world.clubs.find(c=>c.id==='LG')!;
 hurt.health.injuries[club.firstTeam[0]!]={severity:'MILD',remainingTeamGames:3,diagnosedGameKey:'x',seasonKey:'2027'};
 assert.deepEqual(kboClubRosterIssues(hurt),['FIRST_TEAM_INJURED']);assert.equal(kboClubHome(hurt).todos[0]!.code,'FIRST_TEAM_INJURED');
 const gap=structuredClone(g),c2=gap.world.clubs.find(c=>c.id==='LG')!;
 c2.firstTeam=c2.firstTeam.filter(k=>gap.world.players[k]!.position!=='C');
 const codes=kboClubRosterIssues(gap);assert.ok(codes.includes('FIRST_TEAM_SIZE') && codes.includes('FIRST_TEAM_CATCHERS'));
});

test('auto lineup is valid; hand edits are checked (duplicates, outsiders, injured, left-handed middle infield)',()=>{
 const g=make('LG'),auto=autoClubLineup(g);
 assert.deepEqual(validateClubLineup(g,auto),[]);assert.equal(new Set(auto.battingOrder).size,9);
 const dup={...auto,dhKey:auto.fielders.C};assert.ok(validateClubLineup(g,dup).some(i=>i.code==='DUPLICATE_PLAYER'));
 const club=g.world.clubs.find(c=>c.id==='LG')!,outsider=club.roster.find(k=>!club.firstTeam.includes(k)&&g.world.players[k]!.kind==='HITTER')!;
 assert.ok(validateClubLineup(g,{...auto,fielders:{...auto.fielders,LF:outsider}}).some(i=>i.code==='NOT_FIRST_TEAM'&&i.playerKey===outsider));
 const hurt=structuredClone(g);hurt.health.injuries[auto.fielders.SS]={severity:'MILD',remainingTeamGames:2,diagnosedGameKey:'x',seasonKey:'2027'};
 assert.ok(validateClubLineup(hurt,auto).some(i=>i.code==='INJURED'&&i.position==='SS'));
 const lefty=structuredClone(g);lefty.world.players[auto.fielders['2B']]={...lefty.world.players[auto.fielders['2B']]!,throws:'L'};
 assert.ok(validateClubLineup(lefty,auto).some(i=>i.code==='LEFT_THROW_BLOCKED'));
 assert.ok(validateClubLineup(g,{...auto,battingOrder:auto.battingOrder.slice(1)}).some(i=>i.code==='BATTING_ORDER_MISMATCH'));
 assert.ok(validateClubLineup(g,{...auto,startingPitcher:auto.dhKey}).some(i=>i.code==='STARTER_NOT_PITCHER'));
 assert.equal(fitMultiplier(100),1);assert.equal(fitMultiplier(0),.5);assert.equal(fitMultiplier(50),.75);
 // Injured starters are skipped by the automatic choice.
 const sp=structuredClone(g);sp.health.injuries[auto.startingPitcher]={severity:'MILD',remainingTeamGames:2,diagnosedGameKey:'x',seasonKey:'2027'};
 assert.notEqual(autoClubLineup(sp).startingPitcher,auto.startingPitcher);
});
