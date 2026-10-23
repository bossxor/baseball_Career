import type {KboCareer} from './kbo-career-entry.js';
/** Growth ends with the regular range; later postseason diagnoses/recoveries do not rewrite that range. */
export function kboRegularEndInjured(source:KboCareer,lastRegularDay:number){
 const key=source.protagonistKey,days=source.days!.days;
 let after=Object.hasOwn(source.health.injuries,key);
 for(const d of [...days].reverse()){
  const injured=d.result.injured.includes(key),recovered=d.result.recovered.includes(key);
  if(injured && recovered)throw new RangeError('CHANGED_GROWTH_HEALTH_EVIDENCE');
  if(d.day<=lastRegularDay)continue;
  if(injured && !after || recovered && after)throw new RangeError('CHANGED_GROWTH_HEALTH_EVIDENCE');
  if(injured)after=false;else if(recovered)after=true;
 }
 return after;
}

/** Existing paid periods retain legacy validation; new unpaid periods use the opening receipt. */
export function kboOpeningGrowthState(c:KboCareer){
 const key=c.protagonistKey,entries=c.seasonGrowth.entries,tag='opening-health-v1';
 const versions=entries.map(e=>{const id:unknown=JSON.parse(e.periodKey);if(!Array.isArray(id)||id[0]!=='pro-growth')throw new RangeError('INVALID_GROWTH_PLAN_HISTORY');return id.at(-1)===tag;});
 const legacy=()=>({injured:Object.hasOwn(c.health.injuries,key) && c.health.injuries[key]!.seasonKey!==c.world.seasonKey && !c.days!.days.some(d=>d.result.injured.includes(key)),versioned:false});
 if(versions.length && versions.every(v=>!v))return legacy();
 if(versions.some(v=>!v))throw new RangeError('GROWTH_EVIDENCE_REUSED');
 const r=c.openingRoster;
 if(!r){if(versions.length)throw new RangeError('MISSING_GROWTH_OPENING_ROSTER');return legacy();}
 const b:{seasonKey:string;planReceiptKey:string;club:{id:string;roster:string[];firstTeam:string[]};unavailable:string[]}=JSON.parse(r.sourceBasis);
 if(!b || !b.club
  || r.receiptKey!==JSON.stringify(['kbo-opening-roster',c.preseasonPlan?.receiptKey])
  || !c.world.clubs.some(t=>t.id===r.clubId) || r.playerKey!==key || r.seasonKey!==c.world.seasonKey
  || b.seasonKey!==r.seasonKey || b.planReceiptKey!==c.preseasonPlan?.receiptKey || b.club.id!==r.clubId
  || !Array.isArray(b.club.roster) || !b.club.roster.includes(key) || new Set(b.club.roster).size!==b.club.roster.length
  || b.club.roster.some(k=>typeof k!=='string')
  || !Array.isArray(b.club.firstTeam) || b.club.firstTeam.length!==28 || new Set(b.club.firstTeam).size!==28
  || b.club.firstTeam.some(k=>typeof k!=='string' || !b.club.roster.includes(k))
  || JSON.stringify(b.club.firstTeam)!==JSON.stringify(r.firstTeam)
  || !Array.isArray(b.unavailable) || new Set(b.unavailable).size!==b.unavailable.length
  || b.unavailable.some(k=>typeof k!=='string' || !b.club.roster.includes(k) || b.club.firstTeam.includes(k)))throw new RangeError('CHANGED_GROWTH_OPENING_ROSTER');
 return {injured:b.unavailable.includes(key),versioned:true};
}
