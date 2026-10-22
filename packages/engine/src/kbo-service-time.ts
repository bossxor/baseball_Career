import type {KboCareer} from './kbo-career-entry.js';

export const KBO_SERVICE_REQUIREMENTS={registeredGames:100,postingSeasons:7,domesticFaSeasons:8,overseasFaSeasons:9} as const;
type Source=Pick<KboCareer,'world'|'protagonistKey'|'records'|'health'|'proSeasons'|'seasonClose'>;
const validYear=(s:string)=>/^\d{4}$/.test(s) && Number(s)>=2027 && Number(s)<=9999;
/** 01/13/23: registered games, not appearances or elapsed years. Uses official regular KBO games joined to
 * immutable registered-team health evidence, including bench/injury registrations. A closed100-game season
 * supplies one year to each separately named threshold; contract, rights, military and offers are separate gates.
 * Missing historical registration evidence is never invented from batting/pitching totals or current rosters. */
export function kboServiceTimeView(source:Source){
 const current=source.world.seasonKey,closed=new Set<string>();if(!validYear(current) || !source.protagonistKey)throw new RangeError('INVALID_KBO_SERVICE_SOURCE');
 for(const archive of source.proSeasons??[]){const y=archive.seasonKey;if(!validYear(y) || Number(y)>=Number(current) || closed.has(y))throw new RangeError('INVALID_KBO_SERVICE_CLOSED_SEASON');closed.add(y);}
 if(source.seasonClose){if(source.seasonClose.seasonKey!==current)throw new RangeError('INVALID_KBO_SERVICE_CLOSED_SEASON');closed.add(current);}
 const bySeason=new Map<string,Set<string>>(),seen=new Set<string>();
 for(const row of source.health.games){
  const e=row.evidence;if(!e.roster.includes(source.protagonistKey))continue;
  const g=Object.hasOwn(source.records.games,e.gameKey)?source.records.games[e.gameKey]:undefined;
  if(!g || g.scope.leagueKey!=='KBO' || g.scope.phase!=='REGULAR')continue;
  if(g.gameKey!==e.gameKey || !validYear(g.scope.seasonKey) || Number(g.scope.seasonKey)>Number(current) || g.scope.seasonKey!==e.seasonKey || g.worldDay!==e.day || !e.teamKey.startsWith('KBO:') || !Object.hasOwn(g.teams,e.teamKey.slice(4)) || e.roster.filter(k=>k===source.protagonistKey).length!==1)throw new RangeError('INVALID_KBO_SERVICE_REGISTRATION');
  if(seen.has(e.gameKey))throw new RangeError('DUPLICATE_KBO_SERVICE_REGISTRATION');seen.add(e.gameKey);
  const set=bySeason.get(g.scope.seasonKey)??new Set<string>();set.add(e.gameKey);bySeason.set(g.scope.seasonKey,set);
 }
 const seasons=[...new Set([current,...closed,...bySeason.keys()])].sort().map(seasonKey=>{const registeredGames=bySeason.get(seasonKey)?.size??0;return {seasonKey,registeredGames,closed:closed.has(seasonKey),qualified:closed.has(seasonKey) && registeredGames>=KBO_SERVICE_REQUIREMENTS.registeredGames};});
 const qualifiedSeasons=seasons.filter(s=>s.qualified).length,progress=seasons.find(s=>s.seasonKey===current)!;
 return {playerKey:source.protagonistKey,requiredRegisteredGames:KBO_SERVICE_REQUIREMENTS.registeredGames,seasons,qualifiedSeasons,currentSeason:{seasonKey:current,registeredGames:progress.registeredGames,qualifiesWhenClosed:progress.registeredGames>=KBO_SERVICE_REQUIREMENTS.registeredGames},
  registrationThresholds:{posting:{requiredSeasons:KBO_SERVICE_REQUIREMENTS.postingSeasons,reached:qualifiedSeasons>=KBO_SERVICE_REQUIREMENTS.postingSeasons},domesticFa:{requiredSeasons:KBO_SERVICE_REQUIREMENTS.domesticFaSeasons,reached:qualifiedSeasons>=KBO_SERVICE_REQUIREMENTS.domesticFaSeasons},overseasFa:{requiredSeasons:KBO_SERVICE_REQUIREMENTS.overseasFaSeasons,reached:qualifiedSeasons>=KBO_SERVICE_REQUIREMENTS.overseasFaSeasons}}};
}
