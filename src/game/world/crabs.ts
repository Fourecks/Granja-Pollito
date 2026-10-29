import type { Point } from '../navigation';
export type CrabState='hidden'|'emerge'|'walk'|'pause'|'return'|'dig';
export interface Crab {id:string;home:Point;x:number;y:number;target:Point;state:CrabState;since:number;until:number;trips:number;variant:number;size:number;}
/** Local beach wildlife: every excursion retains a clear sandy route to its burrow. */
export class CrabColony {
 readonly crabs:Crab[];private seed=0xc4ab17;
 constructor(private sand:(x:number,y:number)=>boolean,homes:Point[]){
  this.crabs=homes.map((home,i)=>({id:`beach-crab-${i}`,home,x:home[0],y:home[1],target:home,state:i%3===0?'hidden':'emerge',since:0,until:600+i*390,trips:0,variant:i%3,size:18+i%4*2}));
 }
 private random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 private clear(a:Point,b:Point){const steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/3);for(let i=0;i<=steps;i++){const t=i/(steps||1);if(!this.sand(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t))return false;}return true;}
 private next(c:Crab,time:number){
  for(let tries=0;tries<60;tries++){
   const a=this.random()*Math.PI*2,r=12+this.random()*36,p:Point=[c.home[0]+Math.cos(a)*r,c.home[1]+Math.sin(a)*r*.6];
   if(this.clear([c.x,c.y],p)&&this.clear(p,c.home)){c.target=p;c.state='walk';c.since=time;c.trips++;return;}
  }
  c.state='return';c.target=c.home;c.since=time;
 }
 update(time:number,delta:number){
  for(const c of this.crabs){
   if(c.state==='walk'||c.state==='return'){
    const dx=c.target[0]-c.x,dy=c.target[1]-c.y,d=Math.hypot(dx,dy),step=Math.min(d,(c.state==='return'?25:18)*Math.min(delta,60)/1000);
    const x=c.x+dx/(d||1)*step,y=c.y+dy/(d||1)*step;
    if(this.sand(x,y)){c.x=x;c.y=y;}
    if(d<.8){c.x=c.target[0];c.y=c.target[1];c.since=time;if(c.state==='return'){c.state='dig';c.until=time+650;}else{c.state='pause';c.until=time+700+this.random()*1700;}}
   }else if(time>=c.until){
    if(c.state==='hidden'){c.state='emerge';c.since=time;c.until=time+650;c.trips=0;}
    else if(c.state==='emerge')this.next(c,time);
    else if(c.state==='pause'){if(c.trips>=3){c.state='return';c.target=c.home;c.since=time;}else this.next(c,time);}
    else if(c.state==='dig'){c.state='hidden';c.since=time;c.until=time+2600+this.random()*5800;}
   }
  }
 }
}
