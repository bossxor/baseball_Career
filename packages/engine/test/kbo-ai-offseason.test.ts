import {stagedKboOffseason as fixture} from './kbo-offseason-fixtures.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {abilityKeys} from '@playball/rules';
import {prepareKboAiRenewals,refreshKboAiAssessments,kboAiRoleNeed,kboAiCandidatePriority} from '../src/kbo-ai-offseason.js';
import {assertKboRecruitmentWorld} from '../src/kbo-draft.js';
import {kboClubBalance} from '../src/kbo-finance.js';
import type {GameContribution} from '../src/records.js';
import {canonicalJson} from '../src/game.js';


test('private renewal preparation keeps every guaranteed/my contract and moves actual expired NPCs to FA; no player loss or redraw',()=>{
 const input=fixture(),before=canonicalJson(input),n=prepareKboAiRenewals(input);assert.equal(canonicalJson(input),before);assert.ok(n.receipt.expired.length>=10);assert.ok(n.receipt.renewed.length>0);assert.deepEqual(prepareKboAiRenewals(JSON.parse(JSON.stringify(input))),n);
 for(const [key,c] of Object.entries(input.world.contracts))if(!input.expiringKeys.includes(key)){assert.deepEqual(n.world.contracts[key],c);assert.deepEqual(n.world.players[key],input.world.players[key]);}
 for(const c of n.world.clubs){assert.ok(c.roster.length<=50);assert.ok(kboClubBalance(n.world,c.id).availableWon>=0);}
 for(const r of n.receipt.expired){const e=n.pool.players[r.playerKey]!;assert.equal(e.origin,'EXPIRED');assert.equal(e.previousClubId,r.clubId);assert.deepEqual(e.previousContract,input.priorContracts[r.playerKey]);assert.deepEqual(e.player,input.world.players[r.playerKey]);if(e.repertoire)assert.deepEqual(e.repertoire,input.world.repertoires[r.playerKey]);assert.equal(Object.hasOwn(n.world.players,r.playerKey),false);assert.equal(Object.hasOwn(n.world.contracts,r.playerKey),false);}
 for(const r of n.receipt.renewed){assert.equal(n.world.contracts[r.playerKey]!.years,1);assert.equal(n.world.contracts[r.playerKey]!.annualSalaryWon,r.annualSalaryWon);assert.equal(n.world.contracts[r.playerKey]!.seasonKey,'2031');assert.equal(Object.hasOwn(n.pool.players,r.playerKey),false);}
 assert.equal(Object.keys(n.world.players).length+Object.keys(n.pool.players).length,Object.keys(input.world.players).length+Object.keys(input.pool.players).length);assertKboRecruitmentWorld(n.world);
});

test('normal50-person clubs are not forced to release players; guaranteed contracts above the50 target stay intact',()=>{
 const base=fixture(0),n=prepareKboAiRenewals(base);assert.ok(n.receipt.expired.length<=base.expiringKeys.length);assert.equal(Object.keys(n.world.players).length+n.receipt.expired.length,500);
 const high=fixture(10);high.expiringKeys=high.expiringKeys.filter(k=>!high.world.clubs[0]!.roster.includes(k));for(const k of high.world.clubs[0]!.roster){high.priorContracts[k]!.years=4;high.world.contracts[k]!.years=3;}const kept=prepareKboAiRenewals(high);assert.equal(kept.world.clubs[0]!.roster.length,60);for(const k of high.world.clubs[0]!.roster)assert.deepEqual(kept.world.players[k],high.world.players[k]);
});

test('44 gap/backups and priority use explicit public report midpoint; no P field enters the decision boundary',()=>{
 const input=fixture(0),p=Object.values(input.world.players).find(p=>p.position==='C')!;assert.equal(kboAiRoleNeed(p,[]).needScore,100);assert.equal(kboAiRoleNeed(p,[p,p]).needScore,50);assert.equal(kboAiRoleNeed(p,[p,p,p]).needScore,10);const args={roleScore:60,incumbentRoleScore:50,outlookMidpoint:75,needScore:10,annualSalaryWon:120_000_000,budgetWon:12_000_000_000};assert.equal(kboAiCandidatePriority(args),6+15+2-.1);assert.ok(kboAiCandidatePriority({...args,outlookMidpoint:80})>kboAiCandidatePriority(args));assert.throws(()=>kboAiCandidatePriority({...args,outlookMidpoint:101}));
});

test('actual registered bench observations19→20 advance stage once and repeated offseason reads never add evidence',()=>{
 const input=fixture(0),p=input.world.players[input.protagonistKey]!,club=input.world.clubs[0]!,opponent=input.world.clubs[1]!,line={games:1,W:0,L:0,T:1,R:0,RA:0};
 for(let i=0;i<20;i++){const key='observation-'+i,g:GameContribution={gameKey:key,worldDay:50+i,scope:{leagueKey:'KBO',phase:'REGULAR',seasonKey:'2030'},teams:{[club.id]:line,[opponent.id]:line},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};input.records.games[key]=g;input.health.games=[...input.health.games,{evidence:{gameKey:key,teamKey:'KBO:'+club.id,seasonKey:'2030',day:50+i,roster:[p.simulationKey],appearances:[]},result:{injured:[],recovered:[]}}];}
 const base={world:input.world,players:[p],records:input.records,health:{...input.health,games:input.health.games.slice(0,19)},sourceSeasonKey:'2030'},nineteen=refreshKboAiAssessments(base);assert.equal(nineteen[p.simulationKey]!.progress.stage,0);const twenty=refreshKboAiAssessments({...base,health:input.health,reports:nineteen});assert.equal(twenty[p.simulationKey]!.progress.stage,1);assert.equal(twenty[p.simulationKey]!.progress.observed.length,20);assert.deepEqual(refreshKboAiAssessments({...base,health:input.health,reports:twenty}),twenty);for(const axis of abilityKeys(p.kind)){assert.ok(twenty[p.simulationKey]!.ranges[axis]!.lowUnits>=nineteen[p.simulationKey]!.ranges[axis]!.lowUnits);assert.ok(twenty[p.simulationKey]!.ranges[axis]!.highUnits<=nineteen[p.simulationKey]!.ranges[axis]!.highUnits);}
});

test('wrong window/own contract/unexpired candidate/registered FA overlap reject without partially releasing a player',()=>{
 const input=fixture(),before=canonicalJson(input);assert.throws(()=>prepareKboAiRenewals({...input,sourceSeasonKey:'2029'}));assert.throws(()=>prepareKboAiRenewals({...input,expiringKeys:[input.protagonistKey]}));const key=Object.keys(input.priorContracts).find(k=>input.priorContracts[k]!.years>1)!;assert.throws(()=>prepareKboAiRenewals({...input,expiringKeys:[key]}));const bad=structuredClone(input);bad.pool.players[input.protagonistKey]={player:bad.world.players[input.protagonistKey]!,origin:'INDEPENDENT',enteredSeasonKey:'2031',previousClubId:null,previousContract:null};assert.throws(()=>prepareKboAiRenewals(bad));assert.equal(canonicalJson(input),before);
});

test('an expiring injured NPC moves to FA with unchanged recovery games and leaves no ghost injury in the active world',()=>{
 const input=fixture(10),club=input.world.clubs[0]!,key='expired-extra-0';for(const k of club.roster.filter(k=>!k.startsWith('expired-extra-'))){input.priorContracts[k]!.years=4;input.world.contracts[k]!.years=3;}input.expiringKeys=input.expiringKeys.filter(k=>!club.roster.includes(k) || k.startsWith('expired-extra-'));
 input.health.injuries[key]={severity:'MEDIUM',remainingTeamGames:8,diagnosedGameKey:'controlled-past-medical',seasonKey:'2030'};const n=prepareKboAiRenewals(input);assert.equal(n.pool.players[key]!.injury!.remainingTeamGames,8);assert.equal(Object.hasOwn(n.health.injuries,key),false);assert.equal(input.health.injuries[key]!.remainingTeamGames,8);assert.deepEqual(n.health.games,input.health.games);
});
