import type {KboCareer} from './kbo-career-entry.js';
import {p12ActualWindow} from './national-bracket.js';
import type {NationalTournamentWindow} from './national-bracket.js';
import {createStreams,nextInteger} from './rng.js';
import {createMlbPostseason,nextMlbPostseasonGame,recordMlbPostseasonGame} from './us-postseason.js';

/**
 * KBO-only worlds have no MLB simulation. The MLB postseason is a pure function of (seed, worldKey, seasonKey):
 * seeded winners over the real bracket rules, one game per day after the MLB regular-season last day (growth calendar end),
 * the same day layout us-postseason-progress uses. Nothing is stored; every call reproduces the same end day.
 */
export function virtualMlbPostseasonEndDay(c:KboCareer):number {
 const seeds={AL:['AL1','AL2','AL3','AL4','AL5','AL6'],NL:['NL1','NL2','NL3','NL4','NL5','NL6']},priority=['AL1','NL1','AL2','NL2','AL3','NL3','AL4','NL4','AL5','NL5','AL6','NL6'];
 let post=createMlbPostseason(c.world.seasonKey,seeds,priority),rng=createStreams(c.world.seed,JSON.stringify(['virtual-mlb-postseason-1',c.world.worldKey,c.world.seasonKey])).worldCreation;
 for(let game=nextMlbPostseasonGame(post);game;game=nextMlbPostseasonGame(post)){
  const d=nextInteger(rng,100);rng=d.state;
  post=recordMlbPostseasonGame(post,d.value<52?game.homeTeamKey:game.awayTeamKey);
 }
 return c.world.calendar.growthDays.at(-1)!+post.results.length;
}

/** P12 clock for a KBO career: sealed KBO final plus the (virtual) MLB final. Only valid once the KBO postseason is complete. */
export function kboP12Window(c:KboCareer):NationalTournamentWindow {
 const last=c.days?.days.at(-1)?.day;
 if(c.phaseContext.phase!=='SEASON_REVIEW'||!c.postseason?.championKey||last===undefined)throw new RangeError('NATIONAL_PS_END_REQUIRED');
 return p12ActualWindow(Number(c.world.seasonKey),{kboPostseasonEndDay:last,usPostseasonEndDay:virtualMlbPostseasonEndDay(c)});
}
