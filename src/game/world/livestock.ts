import type { NavigationGrid, Point } from '../navigation';
export type Species='cow'|'goat'|'chicken'|'pig'|'horse'|'rabbit';
export interface Habitat {species:Species;home:string;bounds:[number,number,number,number];count:number;size:number;speed:number;}
export const livestockHabitats:Habitat[]=[
 {species:'cow',home:'cow-barn',bounds:[2056,722,2233,756],count:3,size:55,speed:12},
 {species:'horse',home:'horse-stable',bounds:[1013,647,1160,703],count:2,size:60,speed:17},
 {species:'pig',home:'pig-shelter',bounds:[1264,658,1413,700],count:3,size:39,speed:13},
 {species:'chicken',home:'chicken-coop',bounds:[583,869,896,917],count:12,size:17,speed:20},
 {species:'goat',home:'goat-shelter',bounds:[260,1336,385,1394],count:4,size:36,speed:18},
 {species:'rabbit',home:'rabbit-hutch',bounds:[2648,1410,2760,1464],count:5,size:24,speed:25},
];
export interface Livestock {id:string;habitat:Habitat;x:number;y:number;target:Point;state:'walk'|'eat'|'idle';until:number;phase:number;variant:number;facing:number;}
export class LivestockSimulation {
 readonly animals:Livestock[]=[];private seed=0xafe123;
 constructor(private nav:NavigationGrid){
  for(const h of livestockHabitats)for(let i=0;i<h.count;i++){
   const p=this.sample(h);if(!p)throw new Error(`No dry livestock spawn: ${h.species}`);
   this.animals.push({id:`${h.species}-${i}`,habitat:h,x:p[0],y:p[1],target:p,state:i%3===0?'eat':'idle',until:1300+this.random()*4500,phase:this.random()*6.28,variant:i%3,facing:i%2?1:-1});
  }
 }
 private random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 private sample(h:Habitat,from?:Point):Point|undefined {
  const [x,y,right,bottom]=h.bounds;
  for(let i=0;i<120;i++){const p:Point=[x+this.random()*(right-x),y+this.random()*(bottom-y)];
   if(!this.nav.canWalk(...p)||from&&!this.nav.segment(from,p))continue;
   if(this.animals.some(a=>Math.hypot(a.x-p[0],a.y-p[1])<(a.habitat.size+h.size)*.35))continue;
   return p;
  }
 }
 update(time:number,delta:number){
  for(const a of this.animals){
   if(a.state==='walk'){
    const dx=a.target[0]-a.x,dy=a.target[1]-a.y,d=Math.hypot(dx,dy),step=Math.min(d,a.habitat.speed*Math.min(delta,60)/1000);
    const p:Point=[a.x+dx/(d||1)*step,a.y+dy/(d||1)*step];
    const occupied=this.animals.some(b=>b!==a&&Math.hypot(b.x-p[0],b.y-p[1])<(a.habitat.size+b.habitat.size)*.34);
    if(d<1||occupied||!this.nav.canWalk(...p)){a.state=this.random()<.72?'eat':'idle';a.until=time+1800+this.random()*4200;}
    else {a.x=p[0];a.y=p[1];if(Math.abs(dx)>1)a.facing=dx<0?-1:1;}
   }else if(time>a.until){
    const target=this.sample(a.habitat,[a.x,a.y]);
    if(target){a.target=target;a.state='walk';}else a.until=time+1500;
   }
  }
 }
}
