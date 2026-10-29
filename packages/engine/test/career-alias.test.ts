import test from 'node:test';
import assert from 'node:assert/strict';
import {abilityKeys} from '@playball/rules';
import {createCareerPlayer} from '../src/player.js';
import {seedPcg32} from '../src/rng.js';
import {createSeasonGrowthLedger,finalizeSeasonGrowth} from '../src/growth-ledger.js';
import {emptyRecordLedger} from '../src/records.js';
import type {KboCareer} from '../src/kbo-career-entry.js';
import {canonicalJson} from '../src/game.js';
import {settleCareerSeasonAlias,careerAliasView,assertCareerAliases} from '../src/career-alias.js';
import type {CareerAliasLedger} from '../src/career-alias.js';

function career(finalized=true){
 const player=createCareerPlayer({simulationKey:'own',name:'별칭선수',kind:'HITTER',position:'CF',throws:'R',bats:'R',pitchForm:null,archetype:'BALANCED',focus:abilityKeys('HITTER').slice(0,4),difficulty:'GROWTH'},seedPcg32(42n,54n)).player;
 const start=createSeasonGrowthLedger(player,'2027',100),growth=finalized?finalizeSeasonGrowth(player,start,100).ledger:start;
 return {revision:1,world:{worldKey:'alias-world',seasonKey:'2027',players:{own:player}},protagonistKey:'own',protagonistClubId:'club',registration:{firstTeam:true},phaseContext:{phase:'SEASON_REVIEW'},seasonGrowth:growth,records:emptyRecordLedger()}as unknown as KboCareer&{aliases?:CareerAliasLedger};
}
function addGoal(c:KboCareer,year='2027',status:'COMPLETED'|'CORRECTED'='COMPLETED'){
 const completionReceipt=JSON.stringify(['season-goal-completion',c.world.worldKey,'own',year,0,'G02',1]);
 c.goals={schemaVersion:1,worldKey:c.world.worldKey,playerKey:'own',notices:[],seasons:{[year]:{leagueKey:'KBO',teamKey:'club',scheduledGames:144,replacementUsed:false,history:[],slots:[{slot:0,goalId:'G02',scope:{seasonKey:year,leagueKey:'KBO',phase:'REGULAR'},teamKey:'club',status,progress:status==='COMPLETED'?50:49,selectedRevision:1,completionReceipt}]}},rewards:[{rewardId:'R-G02',type:'TITLE',firstReceipt:completionReceipt,sources:[completionReceipt]}]};
}
test('initial type alone creates historical baseline without fabricated E42 or any player/record/growth bonus',()=>{
 const c=career(),before=canonicalJson(c),settled=settleCareerSeasonAlias(c),view=careerAliasView(settled);
 assert.equal(view.current.display,'균형형');assert.equal(view.history.length,1);assert.equal(view.history[0]!.changed,false);assert.equal(view.notices.length,0);
 assert.equal(canonicalJson(c),before);assert.deepEqual(settled.world,c.world);assert.deepEqual(settled.records,c.records);assert.deepEqual(settled.seasonGrowth,c.seasonGrowth);assert.equal(settled.revision,c.revision);
 assert.equal(settleCareerSeasonAlias(settled),settled);assertCareerAliases(JSON.parse(JSON.stringify(settled))as KboCareer);
});
test('selected existing type plus genuinely earned canonical alias produces annual E42 once, corrected commemorative reward remains',()=>{
 const c=career();c.world.players.own!.archetype='SLUGGER';addGoal(c);const settled=settleCareerSeasonAlias(c),view=careerAliasView(settled);
 assert.equal(view.current.display,'거포형 · 라인업의한자리');assert.deepEqual(view.current.recordAliases.map(a=>a.goalId),['G02']);assert.equal(view.history[0]!.before.display,'균형형');assert.equal(view.notices[0]!.definitionId,'E42');
 assert.deepEqual(settled.aliases!.notices[0]!.evidence.fields,{playerOrTeamSimulationKey:'own',worldSeasonId:'2027',windowType:'ALIAS_CHANGED'});
 const corrected=structuredClone(settled);corrected.goals!.seasons['2027']!.slots[0]!.status='CORRECTED';corrected.goals!.seasons['2027']!.slots[0]!.progress=49;
 assert.equal(careerAliasView(corrected).current.display,view.current.display);assert.equal(settleCareerSeasonAlias(corrected),corrected);
});
test('prior earned aliases establish first baseline; no receipt or reward evidence means no record alias',()=>{
 const c=career();addGoal(c,'2026','CORRECTED');assert.equal(careerAliasView(settleCareerSeasonAlias(c)).notices.length,0);
 const unearned=career();addGoal(unearned);unearned.goals!.rewards=[];assert.equal(careerAliasView(unearned).current.recordAliases.length,0);
 const forged=career();addGoal(forged);forged.goals!.seasons['2027']!.slots[0]!.completionReceipt='made-up';assert.equal(careerAliasView(forged).current.recordAliases.length,0);
 assert.throws(()=>settleCareerSeasonAlias(career(false)),/CAREER_ALIAS_YEAR_NOT_FINAL/);
 const partial=career();partial.seasonGrowth.aging!.elapsedDays=50;assert.throws(()=>settleCareerSeasonAlias(partial),/CAREER_ALIAS_YEAR_NOT_FINAL/);
});
test('next annual receipt compares last settled alias, live display follows selected type without publishing midseason events',()=>{
 const first=settleCareerSeasonAlias(career()),next=structuredClone(first);next.revision++;next.world.seasonKey='2028';
 const current=next.world.players.own!;next.seasonGrowth=finalizeSeasonGrowth(current,createSeasonGrowthLedger(current,'2028',100),100).ledger;current.archetype='CONTACT';
 assert.equal(careerAliasView(next).current.display,'교타형');assert.equal(careerAliasView(next).notices.length,0);
 const settled=settleCareerSeasonAlias(next);assert.equal(settled.aliases!.history.length,2);assert.equal(settled.aliases!.history[1]!.before.display,'균형형');assert.equal(careerAliasView(settled).notices.length,1);
 const bad=structuredClone(settled);bad.aliases!.history[1]!.after.display='새별칭';assert.throws(()=>assertCareerAliases(bad),/INVALID_CAREER_ALIAS_SNAPSHOT/);
});
test('pitcher type and G07 use existing labels without a new nickname threshold',()=>{
 const c=career(),player=createCareerPlayer({simulationKey:'own',name:'별칭선수',kind:'PITCHER',position:'CP',throws:'R',bats:'R',pitchForm:'OVERHAND',archetype:'COMMAND',focus:abilityKeys('PITCHER').slice(0,4),difficulty:'GROWTH'},seedPcg32(42n,54n)).player;
 c.world.players.own=player;c.seasonGrowth=finalizeSeasonGrowth(player,createSeasonGrowthLedger(player,'2027',100),100).ledger;addGoal(c);
 const completionReceipt=JSON.stringify(['season-goal-completion',c.world.worldKey,'own','2027',0,'G07',1]),slot=c.goals!.seasons['2027']!.slots[0]!;
 slot.goalId='G07';slot.progress=20;slot.completionReceipt=completionReceipt;c.goals!.rewards=[{rewardId:'R-G07',type:'TITLE',firstReceipt:completionReceipt,sources:[completionReceipt]}];
 assert.equal(careerAliasView(settleCareerSeasonAlias(c)).current.display,'제구형 · 마지막아웃');
});
