import { rectangle, type Point } from '../navigation';
import { zonePlanning, roadConnection } from './zonePlanning';
export const ruralBuildings=zonePlanning.filter(p=>p.kind==='building').map(p=>{
 const house=p.id==='jefa-house',center=p.center,footprint=p.footprint!;
 const door:Point=[center[0],center[1]+footprint.depth/2];
 const texture=house?'jefa-house-v3':['goat-shelter','rabbit-hutch','cow-barn'].includes(p.id)?`${p.id}-v1`:`${p.id}-v2`;
 return {...p,center,footprint,door,texture,displayWidth:house?248:p.id==='horse-stable'?234:p.id==='greenhouse'?216:p.id==='chicken-coop'?202:p.id==='resource-yard'?184:p.id==='pig-shelter'?190:p.id==='cow-barn'?248:p.id==='goat-shelter'?146:p.id==='rabbit-hutch'?154:108,anchor:[door[0],door[1]+6] as Point,connection:roadConnection({...p,door}),interiorId:house?'home':p.id==='cow-barn'?'barn':p.id==='chicken-coop'?'coop':p.id==='greenhouse'?'shed':undefined};
});
export const ruralBuildingObstacles=ruralBuildings.flatMap(p=>{
 const [x,y]=p.center,{width:w,depth:d}=p.footprint;
 return [rectangle(x-w/2,y-d/2,w,d-14),rectangle(x-w/2,y+d/2-14,w/2-19,14),rectangle(x+19,y+d/2-14,w/2-19,14)];
});
export const paddocks=[{id:'horse',x:992,y:624,w:190,h:102,eastGate:true},{id:'pig',x:1244,y:636,w:190,h:86,eastGate:false},{id:'chicken',x:565,y:848,w:350,h:90,eastGate:false},{id:'cow',x:2034,y:700,w:222,h:76,eastGate:false}];
/** These segments are the single source for the visible rails and collisions. */
export const fenceSegments=paddocks.flatMap(p=>{
 const {x,y,w,h}=p,bottom=y+h,gap=p.id==='chicken'?74:64,c=x+w/2;
 const building=ruralBuildings.find(b=>b.id===(p.id==='horse'?'horse-stable':p.id==='pig'?'pig-shelter':p.id==='cow'?'cow-barn':'chicken-coop'))!;
 const leftFoot:Point=[building.center[0]-building.footprint.width/2,building.door[1]],rightFoot:Point=[building.center[0]+building.footprint.width/2,building.door[1]];
 const segments:Array<[Point,Point]>=[[[x,y],leftFoot],[rightFoot,[x+w,y]],[[x,y],[x,bottom]],[[x,bottom],[c-gap/2,bottom]],[[c+gap/2,bottom],[x+w,bottom]]];
 if(p.eastGate)segments.push([[x+w,y+82],[x+w,bottom]]);
 else segments.push([[x+w,y],[x+w,bottom]]);
 return segments;
});
for(const [a,b] of fenceSegments){const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,nx=-dy/l*2,ny=dx/l*2;ruralBuildingObstacles.push([[a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny]]);}
export function buildingConflicts(x:number,y:number,margin=0){return ruralBuildings.some(b=>Math.abs(x-b.center[0])<b.footprint.width/2+margin&&y>b.center[1]-b.footprint.depth/2-5&&y<b.door[1]+12);}
