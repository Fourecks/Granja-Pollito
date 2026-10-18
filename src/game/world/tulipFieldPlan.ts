import { inside, rectangle, type Point, type Polygon, NavigationGrid } from '../navigation';
import { oval, point, MAP } from './mapConfig';
import { zones, type Zone } from './zones';
import { dryAt, type VegetationPlan } from './vegetationPlan';
export const tulipField:Zone={id:'pinkTulipField',center:point(1380,240),approach:point(1286,227),shape:oval(1380,240,134,105,25),surface:'grass',elevation:0};
export const naturalZones=[...zones,tulipField];
export interface Tulip {x:number;y:number;variant:number;height:number;animated:boolean;phase:number;}
export interface GardenProp {id:string;key:'BENCH'|'ARCH'|'TREE_BLOSSOM_PINK'|'FENCE';position:Point;height:number;collision:Polygon[];}
export interface TulipFieldPlan {nav:NavigationGrid;zone:Zone;flowers:Tulip[];props:GardenProp[];obstacles:Polygon[];path:Point[];rest:Point;bounds:{x:number;y:number;width:number;height:number};}
export function distanceToPath(x:number,y:number,line:readonly Point[]):number {
 let distance=Infinity;
 for(let i=1;i<line.length;i++){const a=line[i-1],b=line[i],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));distance=Math.min(distance,Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy));}
 return distance;
}
const excluded=zones.filter(z=>!['woodland','beach','lakeIsland','fishingArea'].includes(z.id));
export function fieldGround(x:number,y:number){return dryAt(x,y)&&!zones.some(z=>inside([x,y],z.shape));}
export function createTulipFieldPlan(existing:VegetationPlan,nav:NavigationGrid):TulipFieldPlan {
 const entry=tulipField.approach,rest=point(1400,249),bench=point(1400,237),tree=point(1440,250);
 const props:GardenProp[]=[
  {id:'pinkTulipBench',key:'BENCH',position:bench,height:43,collision:[rectangle(bench[0]-35,bench[1]-10,70,20)]},
  {id:'pinkTulipCherry',key:'TREE_BLOSSOM_PINK',position:tree,height:132,collision:[rectangle(tree[0]-11,tree[1]-7,22,14)]},
  {id:'pinkTulipArch',key:'ARCH',position:entry,height:88,collision:[rectangle(entry[0]-38,entry[1]-7,9,14),rectangle(entry[0]+29,entry[1]-7,9,14)]},
  {id:'pinkTulipFenceWest',key:'FENCE',position:point(1285,288),height:28,collision:[]},
  {id:'pinkTulipFenceEast',key:'FENCE',position:point(1487,279),height:28,collision:[]},
 ];
 for(const prop of props.filter(p=>p.collision.length))if(!fieldGround(...prop.position)||!nav.canWalk(...prop.position))throw new Error('Emplazamiento del jardín bloqueado: '+prop.id);
 const gardenNav=new NavigationGrid({...nav.data,obstacles:[...nav.data.obstacles,...props.flatMap(p=>p.collision)]},nav.radius);
 const targets=[entry,point(1330,263),rest,point(1470,221)];
 const path:Point[]=[point(1173,270)];
 for(const target of targets){const route=gardenNav.path(path[path.length-1],target);if(!route.length)throw new Error('Sendero de tulipanes sin conexión');path.push(...route);}
 const obstacles=props.flatMap(p=>p.collision);
 let state=0x54554c50;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const flowers:Tulip[]=[];
 const bounds={x:2480,y:250,width:570,height:465};
 for(let i=0;i<4800;i++){
  const x=Math.round(bounds.x+random()*bounds.width),y=Math.round(bounds.y+random()*bounds.height);
  if(!inside([x,y],tulipField.shape)||!fieldGround(x,y)||excluded.some(z=>inside([x,y],z.shape)))continue;
  if(![[0,-20],[-12,0],[12,0]].every(([dx,dy])=>fieldGround(x+dx,y+dy)))continue;
  if(distanceToPath(x,y,path)<19||Math.hypot(x-rest[0],(y-rest[1])*1.3)<51)continue;
  if(props.some(p=>Math.hypot(x-p.position[0],y-p.position[1])<(p.key==='TREE_BLOSSOM_PINK'?27:28)))continue;
  if(existing.plants.some(p=>p.solid&&Math.hypot(x-p.x,y-p.y)<p.width*.32+12))continue;
  const patch=Math.sin(x/39+y/73)*.5+Math.cos(y/29-x/87)*.5;
  if(patch<-.6&&random()>.3)continue;
  flowers.push({x,y,variant:random()<.68?Math.floor(random()*5):random()<.72?5:random()<.75?6:7,height:26+random()*8,animated:(Math.abs(Math.sin(Math.floor(x/96)*12.9898+Math.floor(y/32)*78.233)*43758.5453)%1)<.30,phase:random()*.5});
 }
 // A short, straight passage crosses the gate plane instead of turning back at its feet.
 const entrance=path.findIndex(p=>p[0]===entry[0]&&p[1]===entry[1]);
 const correctedPath:Point[]=[...path.slice(0,entrance),point(1286,244),entry,point(1286,213),point(1303,213),point(1316,236),point(1317,241),...path.slice(entrance+1)];
 return {nav:gardenNav,zone:tulipField,flowers:flowers.filter(f=>distanceToPath(f.x,f.y,correctedPath)>=19),props,obstacles,path:correctedPath,rest,bounds:{...bounds,width:Math.min(bounds.width,MAP.width-bounds.x)}};
}
