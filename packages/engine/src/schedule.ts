export interface ScheduledGame {
  simulationKey:string; leagueKey:string; seasonKey:string; round:number; worldDay:number; awayTeamKey:string; homeTeamKey:string; phase?:'POSTSEASON';
}
export interface ScheduleInput { teamKeys:readonly string[]; leagueKey:string; seasonKey:string; startDay:number }
function teams(input:ScheduleInput):string[] {
  const ids=[...input.teamKeys].sort();
  if(ids.length<2 || ids.length>100 || ids.some(id=>!id || id.length>128) || new Set(ids).size!==ids.length || !input.leagueKey || !input.seasonKey || !Number.isSafeInteger(input.startDay) || input.startDay<0) throw new RangeError('INVALID_SCHEDULE_INPUT');
  return ids;
}
/** Circle method: fixed logical-key sort, one bye per round for odd team counts. */
function pairRounds(ids:readonly string[]):[string,string][][] {
  const rotation:(string|null)[]=[...ids];if(rotation.length%2) rotation.push(null);
  const rounds:[string,string][][]=[];
  for(let r=0;r<rotation.length-1;r++) {
    const games:[string,string][]=[];
    for(let i=0;i<rotation.length/2;i++) {const a=rotation[i]!,b=rotation[rotation.length-1-i]!;if(a!==null && b!==null) games.push([a,b]);}
    rounds.push(games);rotation.splice(1,0,rotation.pop()!);
  }
  return rounds;
}
function materialize(input:ScheduleInput,rounds:readonly (readonly [string,string][])[]):ScheduledGame[] {
  return rounds.flatMap((games,round)=>games.map(([awayTeamKey,homeTeamKey],slot)=>({simulationKey:JSON.stringify([input.seasonKey,input.leagueKey,round,slot]),leagueKey:input.leagueKey,seasonKey:input.seasonKey,round,worldDay:input.startDay+round+Math.floor(round/6),awayTeamKey,homeTeamKey})));
}
/** 01/43: each opponent equally, even repeats guarantee exact pairwise home/away symmetry. */
export function createRoundRobinSchedule(input:ScheduleInput,repetitions:number):ScheduledGame[] {
  const ids=teams(input);
  if(!Number.isSafeInteger(repetitions) || repetitions<2 || repetitions>100 || repetitions%2) throw new RangeError('INVALID_REPETITIONS');
  const base=pairRounds(ids), rounds:[string,string][][]=[];
  for(let cycle=0;cycle<repetitions;cycle++) for(const pairs of base) rounds.push(pairs.map(([a,b],i)=>((cycle+i)%2?[b,a]:[a,b]) as [string,string]));
  return materialize(input,rounds);
}
/** One meeting per pair, balanced venues; a virtual edge closes odd degrees without adding a matchday. */
export function createSingleRoundRobinSchedule(input:ScheduleInput):ScheduledGame[] {
 const ids=teams(input),base=pairRounds(ids);
 if(ids.length%2)return materialize(input,balanceVenues(ids,base));
 const virtual='__venue_balance__';if(ids.includes(virtual))throw new RangeError('INVALID_SCHEDULE_INPUT');
 return materialize(input,balanceVenues([...ids,virtual],[...base,ids.map(id=>[id,virtual] as [string,string])]).slice(0,base.length));
}
/** Orient an even-degree multigraph along Euler circuits: in/out degrees are exactly equal. */
function balanceVenues(ids:readonly string[],rounds:[string,string][][]):[string,string][][] {
  const edges=rounds.flat(),adj=new Map(ids.map(id=>[id,[] as number[]]));
  edges.forEach(([a,b],i)=>{adj.get(a)!.push(i);adj.get(b)!.push(i);});
  if([...adj.values()].some(list=>list.length%2)) throw new RangeError('UNBALANCED_VENUE_DEGREE');
  const used=new Set<number>(),oriented=new Map<number,[string,string]>();
  for(const first of ids) {
    const stack=[first];
    while(stack.length) {
      const current=stack[stack.length-1]!,list=adj.get(current)!;
      while(list.length && used.has(list[list.length-1]!)) list.pop();
      if(!list.length) {stack.pop();continue;}
      const edge=list.pop()!,[a,b]=edges[edge]!,other=current===a?b:a;
      used.add(edge);oriented.set(edge,[current,other]);stack.push(other);
    }
  }
  let cursor=0;
  return rounds.map(round=>round.map(()=>oriented.get(cursor++)!));
}
/** 13: full organization leagues; partial final cycle is a regular graph of whole matchdays. */
export function createEvenLeagueSchedule(input:ScheduleInput,gamesPerTeam:number):ScheduledGame[] {
  const ids=teams(input);
  if(ids.length%2 || !Number.isSafeInteger(gamesPerTeam) || gamesPerTeam<2 || gamesPerTeam>400 || gamesPerTeam%2) throw new RangeError('INVALID_LEAGUE_DEGREE');
  const base=pairRounds(ids), rounds:[string,string][][]=[];
  for(let i=0;i<gamesPerTeam;i++) rounds.push(base[i%base.length]!.map(([a,b])=>[a,b]));
  return materialize(input,balanceVenues(ids,rounds));
}
export function assertSchedule(schedule:readonly ScheduledGame[],teamKeys:readonly string[],expectedGamesPerTeam:number,expectedHomePerTeam:number):void {
  const ids=new Set(teamKeys),keys=new Set<string>(),onDay=new Set<string>(),count=new Map(teamKeys.map(id=>[id,{games:0,home:0,days:[] as number[]}]));
  if(ids.size!==teamKeys.length || !Number.isSafeInteger(expectedGamesPerTeam) || !Number.isSafeInteger(expectedHomePerTeam)) throw new RangeError('INVALID_SCHEDULE_EXPECTATION');
  for(const game of schedule) {
    if(keys.has(game.simulationKey) || game.awayTeamKey===game.homeTeamKey || !ids.has(game.awayTeamKey) || !ids.has(game.homeTeamKey) || !Number.isSafeInteger(game.worldDay) || game.worldDay<0) throw new RangeError('INVALID_SCHEDULE');
    keys.add(game.simulationKey);
    for(const id of [game.awayTeamKey,game.homeTeamKey]) {
      const key=JSON.stringify([game.worldDay,id]);if(onDay.has(key)) throw new RangeError('DOUBLE_BOOKED_TEAM');onDay.add(key);
      const line=count.get(id)!;line.games++;if(id===game.homeTeamKey) line.home++;line.days.push(game.worldDay);
    }
  }
  for(const line of count.values()) {
    if(line.games!==expectedGamesPerTeam || line.home!==expectedHomePerTeam) throw new RangeError('INVALID_GAME_COUNT');
    const days=line.days.sort((a,b)=>a-b);let consecutive=0,last=-2;
    for(const day of days) {consecutive=day===last+1?consecutive+1:1;last=day;if(consecutive>6) throw new RangeError('MISSING_REST_DAY');}
  }
}
