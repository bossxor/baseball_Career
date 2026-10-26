import {abilityKeys,overall} from '@playball/rules';
import type {UsCareer} from './us-career-entry.js';
import {assertUsCareerRevision} from './us-career-entry.js';
import {validateDevelopmentPlayer} from './player.js';
import {recordTotals} from './records.js';
import type {RecordScope,BattingTotals,PitchingTotals} from './records.js';
import {battingRates,pitchingRates,inningsDisplay,emptyBatting,emptyPitching} from './stats.js';
import {pitchMastery,validatePitchWeights} from './repertoire.js';
import type {PitchId} from '@playball/rules';

const compare=(a:string,b:string)=>a<b?-1:a>b?1:0;
function batting(line:BattingTotals|undefined){const s=line??{...emptyBatting(),games:0,twoB:0,threeB:0};return {games:s.games,PA:s.PA,AB:s.AB,H:s.H,twoB:s.twoB,threeB:s.threeB,HR:s.HR,TB:s.TB,R:s.R,RBI:s.RBI,BB:s.BB,HBP:s.HBP,K:s.K,rates:battingRates(s)};}
function pitching(line:PitchingTotals|undefined){const s=line??{...emptyPitching(),games:0,starts:0,W:0,L:0,SV:0,HLD:0};return {games:s.games,starts:s.starts,W:s.W,L:s.L,SV:s.SV,HLD:s.HLD,BF:s.BF,outs:s.outs,innings:inningsDisplay(s.outs),H:s.H,HR:s.HR,R:s.R,ER:s.ER,BB:s.BB,HBP:s.HBP,K:s.K,rates:pitchingRates(s)};}
/** S09 read allowlist for a frozen retired pro root. No copying/importing, account storage or live registration.
 * Rates always stay inside one league and phase; counts are actual official individual contributions only. */
export function usRetirementArchiveView(source:UsCareer){
 assertUsCareerRevision(source,source.revision);
 const r=source.retirement,key=source.protagonistKey,p=source.world.players[key],club=source.world.organizations.find(c=>c.id===source.protagonistOrganizationId);
 if(source.phaseContext.phase!=='ARCHIVED'||!r||!p||!club)throw new RangeError('US_ARCHIVE_NOT_AVAILABLE');
 validateDevelopmentPlayer(p);
 const scopes=new Map<string,RecordScope>();
 for(const g of Object.values(source.records.games))if(Object.hasOwn(g.batting,key) || Object.hasOwn(g.pitching,key))scopes.set(JSON.stringify([g.scope.seasonKey,g.scope.leagueKey,g.scope.phase]),g.scope);
 // A signed pro career with no first-team appearance remains a valid zero-record archive.
 if(![...scopes.values()].some(s=>s.leagueKey==='MLB' && s.phase==='REGULAR'))scopes.set('zero-mlb',{seasonKey:r.seasonKey,leagueKey:'MLB',phase:'REGULAR'});
 const own=(scope:{leagueKey:string;phase:RecordScope['phase'];seasonKey?:string})=>{const t=recordTotals(source.records,scope);return p.kind==='HITTER'?{kind:'HITTER' as const,...batting(t.batting[key])}:{kind:'PITCHER' as const,...pitching(t.pitching[key])};};
 const rows=[...scopes.values()].sort((a,b)=>compare(a.seasonKey,b.seasonKey) || compare(a.leagueKey,b.leagueKey) || compare(a.phase,b.phase)).map(scope=>({...scope,record:own(scope)}));
 const groups=new Map<string,Pick<RecordScope,'leagueKey'|'phase'>>();for(const s of scopes.values())groups.set(JSON.stringify([s.leagueKey,s.phase]),{leagueKey:s.leagueKey,phase:s.phase});
 const records=[...groups.values()].sort((a,b)=>compare(a.leagueKey,b.leagueKey) || compare(a.phase,b.phase)).map(scope=>({...scope,record:own(scope)}));
 const score=overall(p.kind,p.abilities),peak=overall(p.kind,p.careerPeaks),book=source.world.repertoires[key];
 if(p.kind==='PITCHER' && !book || p.kind==='HITTER' && book)throw new RangeError('US_ARCHIVE_REPERTOIRE_INVALID');if(book)validatePitchWeights(book.book,book.weights);
 return {archiveKey:r.receiptKey,retirement:{reason:r.reason,seasonKey:r.seasonKey,age:r.age,lastTeam:{id:club.id,name:club.name},endedContractKey:r.endedContractKey},player:{playerKey:key,name:p.name,kind:p.kind,position:p.position,throws:p.throws,bats:p.bats,pitchForm:p.pitchForm??null,archetype:p.archetype,
  overall:Math.round(score.sumUnits/score.denominator*10)/10,careerPeakAbilityAverage:Math.round(peak.sumUnits/peak.denominator*10)/10,abilities:abilityKeys(p.kind).map(ability=>({ability,current:p.abilities[ability]!/10_000,careerPeak:p.careerPeaks[ability]!/10_000})),
  pitches:book?Object.keys(book.book).sort().map(pitchId=>({pitchId,active:Object.hasOwn(book.weights,pitchId),weight:book.weights[pitchId as PitchId]??0,mastery:pitchMastery(book.book[pitchId as PitchId]!)})):[]},records,seasonRows:rows};
}
