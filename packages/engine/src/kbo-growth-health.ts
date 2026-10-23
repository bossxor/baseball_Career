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
