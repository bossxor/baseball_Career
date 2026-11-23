import {setTimeout} from 'node:timers/promises';
import {createDbFromUrl} from '@playball/db';
import {advanceNextSeasonJob} from './season-jobs.js';

if(process.env.PLAYBALL_SEASON_JOBS!=='1')throw new Error('Set PLAYBALL_SEASON_JOBS=1 to run the season worker');
const databaseUrl=process.env.DATABASE_URL;
if(!databaseUrl)throw new Error('DATABASE_URL is required for the season worker');

const {db,pool}=createDbFromUrl(databaseUrl),pause=new AbortController();
pool.on('error',()=>console.error(JSON.stringify({level:'error',message:'Season worker database connection lost'})));
let stopping=false,backoffMs=1000;
for(const signal of ['SIGINT','SIGTERM'] as const)process.once(signal,()=>{
 stopping=true;pause.abort();
});

try{
 while(!stopping){
  let delay=1000;
  try{
   const worked=await advanceNextSeasonJob(db);
   backoffMs=1000;
   if(worked)continue;
  }catch{
   console.error(JSON.stringify({level:'error',message:'Season job step failed; retrying',retryAfterMs:backoffMs}));
   delay=backoffMs;backoffMs=Math.min(30_000,backoffMs*2);
  }
  if(!stopping)await setTimeout(delay,undefined,{signal:pause.signal}).catch(error=>{
   if(!stopping)throw error;
  });
 }
}finally{
 await pool.end();
}
