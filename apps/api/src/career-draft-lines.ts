import type {kboDraftView} from '@playball/engine';

/** Only the draft's public projection; do not expose the score, seed or sampled draw. */
export function draftLines(preview:ReturnType<typeof kboDraftView>['preview']){
 const lines=[{label:'예상 라운드',value:preview.conditionalLikelyRounds.length?preview.conditionalLikelyRounds.map(round=>round+'라운드').join(' · '):'지명 예상 없음'}];
 const probability=(label:string,value:number)=>{if(value>=0&&value<1-1e-9)lines.push({label,value:(value*100).toLocaleString('ko-KR',{maximumFractionDigits:1})+'%'});};
 probability('지명 확률',preview.selectionProbability);
 probability('미지명 확률',preview.undraftedProbability);
 for(const round of preview.roundProbabilities)if(round.probability>0)probability(round.round+'라운드 확률',round.probability);
 return lines;
}
