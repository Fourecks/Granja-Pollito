import type { Point } from './navigation';
interface Request {search:Generator<void,Point[],unknown>;done:(route:Point[])=>void;priority:number;}
/** One shared per-scene CPU budget, with tasks ahead of background patrols. */
export class RouteQueue {
 private requests=new Map<string,Request>();
 private completed=0;private maxSlice=0;
 request(id:string,search:Request['search'],done:Request['done'],priority=0){this.requests.set(id,{search,done,priority});}
 has(id:string){return this.requests.has(id);}
 clear(){this.requests.clear();}
 update(budget=2){
  const start=performance.now();
  while(this.requests.size&&performance.now()-start<budget){
   let current:[string,Request]|undefined;
   for(const entry of this.requests)if(!current||entry[1].priority>current[1].priority)current=entry;
   const [id,request]=current!,step=request.search.next();
   if(step.done){this.requests.delete(id);this.completed++;request.done(step.value);}
  }
  this.maxSlice=Math.max(this.maxSlice,performance.now()-start);
 }
 get diagnostics(){return {pending:this.requests.size,completed:this.completed,maxSliceMs:Math.round(this.maxSlice*100)/100,budgetMs:2};}
}
