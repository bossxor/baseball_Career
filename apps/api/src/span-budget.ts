/** Wall-clock cap for one chained "season/month" request. The engine's results never depend on chunking, so stopping early only
 * means the user presses the same CTA again; it keeps a request under proxy/mobile timeouts. Override with PLAYBALL_SPAN_BUDGET_MS. */
export const spanDeadline=():number=>Date.now()+Number(process.env.PLAYBALL_SPAN_BUDGET_MS??25_000);

/** Why a chained advance stopped, for the screen: BUDGET (request time cap, press again), MONTH_END, EVENT (a mandatory stop), SEASON_END. */
export type SpanStop='BUDGET'|'MONTH_END'|'EVENT'|'SEASON_END';
export function spanStopOf(span:'SEASON'|'MONTH',phase:string,stopReason:string,monthDone:boolean):SpanStop{
 if(phase==='SEASON_REVIEW')return 'SEASON_END';
 if(phase!=='SEASON_PROGRESS')return 'EVENT';
 if(span==='MONTH'&&monthDone)return 'MONTH_END';
 return stopReason==='CHUNK_LIMIT'||stopReason==='DAY_CLOSED'?'BUDGET':'EVENT';
}
/** Completed / scheduled regular-season games of one team, counted from saved records. */
export function teamProgress(schedule:readonly {simulationKey:string;homeTeamKey:string;awayTeamKey:string}[],teamKey:string,played:object):{done:number;total:number}{
 const mine=schedule.filter(g=>g.homeTeamKey===teamKey||g.awayTeamKey===teamKey);
 return {done:mine.filter(g=>Object.hasOwn(played,g.simulationKey)).length,total:mine.length};
}
