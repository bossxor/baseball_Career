import {preparedUsCareer} from './us-fixtures.js';
import {startUsRegularSeason,US_LEVELS,usSalaryEntitlement,salaryContractKey} from '../src/us-season.js';
import {canonicalJson} from '../src/game.js';
import {assertContributionSplits} from '../src/records.js';
import {emptyBatting,emptyPitching} from '../src/stats.js';
import type {UsCareer} from '../src/us-career-entry.js';
/** Controlled certified contribution/date fixtures; not a native8790-game playthrough. */
let cached:UsCareer|undefined;
export function reviewedUsCareerFixture(prepared?:UsCareer){if(!prepared&&cached)return structuredClone(cached);const p=prepared??preparedUsCareer(),c=p.phaseContext.phase==='PRESEASON_SETUP'?startUsRegularSeason(p,p.revision):structuredClone(p),s=c.season!,key=c.protagonistKey,level=c.registration.level,club=c.protagonistOrganizationId;c.world={...c.world,players:{...c.world.players,[key]:structuredClone(c.world.players[key]!)}};c.records={...c.records,games:{...c.records.games}};c.world.players[key]!.potential=Object.fromEntries(Object.keys(c.world.players[key]!.potential).map(k=>[k,1000000]));
 if(s.days.length)throw Error('Controlled full-year fixture requires no previously closed dates');const levelOn=(day:number)=>{let l=s.levelMoves?.[0]?.from??level;for(const m of s.levelMoves??[])if(day>m.day)l=m.to;return l;};
 const zero={PA:0,AB:0,H:0,BB:0,HBP:0,K:0,TB:0,HR:0,twoB:0,threeB:0,RBI:0};
 const strikeouts={...zero,PA:4,AB:4,K:4};
 const zeroPitch={BF:0,outs:0,AB:0,H:0,TB:0,HR:0,BB:0,HBP:0,K:0};
 const pitchingStrikeouts={...zeroPitch,BF:4,outs:4,AB:4,K:4};
 for(const league of US_LEVELS)for(const game of c.seasonSchedule!.leagues[league]){
  if(c.records.games[game.simulationKey])continue;
  const own=league===levelOn(game.worldDay)&&(game.homeTeamKey===club||game.awayTeamKey===club);
  const row:UsCareer['records']['games'][string]={
   gameKey:game.simulationKey,worldDay:game.worldDay,scope:{seasonKey:c.world.seasonKey,leagueKey:league,phase:'REGULAR'},
   teams:{
    [game.homeTeamKey]:{games:1,W:0,L:0,T:1,R:0,RA:0},
    [game.awayTeamKey]:{games:1,W:0,L:0,T:1,R:0,RA:0},
   },
   batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{},
  };
  if(own){
   const ownHitter=c.world.players[key]!.kind==='HITTER';
   const opponentId=game.homeTeamKey===club?game.awayTeamKey:game.homeTeamKey;
   const opponent=c.world.organizations.find(o=>o.id===opponentId)?.levels[league].find(k=>
    c.world.players[k]?.kind===(ownHitter?'PITCHER':'HITTER'));
   if(!opponent)throw Error('Controlled scheduled matchup requires an opposing player');
   const batterKey=ownHitter?key:opponent,pitcherKey=ownHitter?opponent:key;
   const batter=c.world.players[batterKey]!,pitcher=c.world.players[pitcherKey]!;
   const side=batter.bats==='S'?(pitcher.throws==='R'?'L':'R'):batter.bats;
   row.batting[batterKey]={...emptyBatting(),PA:4,AB:4,K:4,twoB:0,threeB:0,games:1,
    fieldingGames:1,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0};
   row.pitching[pitcherKey]={...emptyPitching(),BF:4,outs:4,K:4,games:1,starts:1,
    starterOuts:4,loadedBF:0,W:0,L:0,SV:0,HLD:0,BS:0,shutouts:0};
   row.batterSplits[batterKey]={L:{...zero},R:{...zero},[pitcher.throws]:{...strikeouts}};
   row.pitcherSplits[pitcherKey]={L:{...zeroPitch},R:{...zeroPitch},[side]:{...pitchingStrikeouts}};
   row.matchups[JSON.stringify([batterKey,pitcherKey])]={batterKey,pitcherKey,stats:{...strikeouts}};
   assertContributionSplits(row);
  }
  c.records.games[game.simulationKey]=row;
 }
 c.records.revision=Object.keys(c.records.games).length;
 for(let day=s.firstDay;day<=s.lastDay;day++){const games=US_LEVELS.flatMap(l=>c.seasonSchedule!.leagues[l].filter(g=>g.worldDay===day).map(g=>c.records.games[g.simulationKey]!)),amount=usSalaryEntitlement(c,day-s.firstDay+1)-s.paidUsd,entryKey=JSON.stringify(['us-salary',salaryContractKey(c,day),c.world.seasonKey,day]);s.days.push({day,evidence:canonicalJson(games),level:levelOn(day),appearances:games.reduce((n,g)=>n+(c.world.players[key]!.kind==='HITTER'?(g.batting[key]?.PA??0):(g.pitching[key]?.outs??0)),0),rehabilitating:false,injured:[],recovered:[]});s.paidUsd+=amount;s.payroll=[...s.payroll,{day,amount,entryKey}];c.income=[...c.income,{entryKey,currency:'USD',kind:'SALARY',amount,day,seasonKey:c.world.seasonKey}];}c.phaseContext={phase:'SEASON_REVIEW'};if(!prepared)cached=c;return prepared?c:structuredClone(c);}
