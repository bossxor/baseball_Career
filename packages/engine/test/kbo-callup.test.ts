import test from 'node:test';
import assert from 'node:assert/strict';
import {abilityKeys} from '@playball/rules';
import {confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {startKboRegularSeason} from '../src/kbo-progress.js';
import type {KboSeasonProgress} from '../src/kbo-progress.js';
import {reviewKboCallup,resolveKboCallup} from '../src/kbo-callup.js';
import {protagonistLeague} from '../src/kbo-windows.js';
import {createKboCompetitionGameWorld} from '../src/kbo-game-world.js';
import type {KboCareer} from '../src/kbo-career-entry.js';
import type {GameContribution} from '../src/records.js';
import {enteredKboCareer} from './fixtures.js';

const started=()=>{const e=enteredKboCareer('HITTER'),p=confirmKboPreseasonPlan(e,e.revision),o=confirmKboOpeningRoster(p,p.revision),s=confirmKboSeasonSchedule(o,o.revision);return startKboRegularSeason(s,s.revision);};
/** Controlled FUTURES games of my club (not a full simulation); `units` sets every ability of my player. */
function futures(n:number,units?:number):KboCareer {
 const c=structuredClone(started()),club=c.world.clubs.find(x=>x.id===c.protagonistClubId)!;
 // The fixture rookie opens on the first team; move me to futures by swapping with a futures player of my kind.
 if(club.firstTeam.includes(c.protagonistKey)){const me=c.world.players[c.protagonistKey]!,sub=club.roster.find(k=>!club.firstTeam.includes(k) && c.world.players[k]!.kind===me.kind && c.world.players[k]!.position===me.position)!;club.firstTeam=club.firstTeam.map(k=>k===c.protagonistKey?sub:k);c.registration={...c.registration,firstTeam:false,competitionKey:'FUTURES'};}
 if(units!==undefined){const p=c.world.players[c.protagonistKey]!;const v=Object.fromEntries(abilityKeys(p.kind).map(k=>[k,units]));c.world.players[c.protagonistKey]={...p,abilities:v,potential:{...v},careerPeaks:{...v}};}
 for(let i=0;i<n;i++){const gameKey=`fut-${i}`;c.records.games[gameKey]={gameKey,worldDay:i+1,scope:{seasonKey:c.world.seasonKey,leagueKey:'FUTURES',phase:'REGULAR'},teams:{[c.protagonistClubId]:{games:1,W:1,L:0,T:0,R:0,RA:0},opp:{games:1,W:0,L:1,T:0,R:0,RA:0}},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}} as GameContribution;}
 return c;
}
const progress=(c:KboCareer)=>c.phaseContext as KboSeasonProgress;

test('a futures player is reviewed only at each 20th futures team game and only once',()=>{
 const base=futures(19,1_000_000);assert.equal(protagonistLeague(base),'FUTURES');
 assert.equal(reviewKboCallup(base,50,progress(base)),null);
 const at20=futures(20,10_000),reviewed=reviewKboCallup(at20,50,progress(at20))!;
 assert.equal(reviewed.callupReviews!.at(-1)!.outcome,'BELOW');assert.equal(reviewed.phaseContext.phase,'SEASON_PROGRESS');
 assert.equal(reviewKboCallup(reviewed,51,progress(reviewed)),null);
});

test('a stronger futures player is offered E09; ACCEPT swaps the weakest same-position first-team player',()=>{
 const c=futures(20,1_000_000),offered=reviewKboCallup(c,50,progress(c))!;
 const review=offered.callupReviews!.at(-1)!;assert.equal(review.outcome,'OFFERED');assert.ok(review.comparedKey);
 const event=offered.events.at(-1)!;assert.equal(event.definitionId,'E09');assert.equal(offered.phaseContext.phase,'EVENT_DECISION');
 const accepted=resolveKboCallup(offered,offered.revision,{eventKey:event.eventKey,eventVersion:event.version,command:'ACCEPT_CALLUP'});
 const club=accepted.world.clubs.find(x=>x.id===accepted.protagonistClubId)!;
 assert.ok(club.firstTeam.includes(accepted.protagonistKey));assert.ok(!club.firstTeam.includes(review.comparedKey!));assert.equal(club.firstTeam.length,28);
 assert.equal(protagonistLeague(accepted),'KBO');assert.equal(accepted.registration.competitionKey,'KBO');assert.equal(accepted.phaseContext.phase,'SEASON_PROGRESS');
 assert.doesNotThrow(()=>createKboCompetitionGameWorld(accepted.world,'KBO',accepted.protagonistKey));
 assert.throws(()=>resolveKboCallup(accepted,accepted.revision,{eventKey:event.eventKey,eventVersion:event.version,command:'ACCEPT_CALLUP'}));
 const deferred=resolveKboCallup(offered,offered.revision,{eventKey:event.eventKey,eventVersion:event.version,command:'DEFER_CALLUP'});
 assert.equal(protagonistLeague(deferred),'FUTURES');assert.equal(deferred.events.at(-1)!.status,'RESOLVED');
 // E09 is the first call-up only.
 const later=structuredClone(deferred);for(let i=20;i<40;i++){const g=structuredClone(later.records.games['fut-0']!);g.gameKey=`fut-${i}`;g.worldDay=i+1;later.records.games[g.gameKey]=g;}
 const again=reviewKboCallup(later,80,progress(later));assert.equal(again,null);
});

test('an injured futures player is reviewed without an offer',()=>{
 const c=futures(20,1_000_000);c.health={...c.health,injuries:{...c.health.injuries,[c.protagonistKey]:{severity:'MILD',remainingTeamGames:2,diagnosedGameKey:'x',seasonKey:c.world.seasonKey}}};
 const r=reviewKboCallup(c,50,progress(c))!;assert.equal(r.callupReviews!.at(-1)!.outcome,'INJURED');assert.equal(r.events.some(e=>e.definitionId==='E09'),false);
});
