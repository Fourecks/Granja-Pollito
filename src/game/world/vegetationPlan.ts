import { inside, rectangle, type Point, type Polygon } from '../navigation';
import { MAP, mainland, islands, rawWater, cliffFaces, roads, bridges, ramps, rivers } from './mapConfig';
import { zones, zoneById } from './zones';
import { gatheringPoints, celebrationHumans } from '../../data/celebration';
export const VEGETATION_NAMES = [
 'TREE_GREEN_01','TREE_GREEN_02','TREE_GREEN_03','FRUIT_TREE_01','FRUIT_TREE_02','PINE_01','PINE_02','TREE_BLOSSOM_PINK',
 'TREE_BLOSSOM_WHITE','TREE_BLOSSOM_PURPLE','TREE_AUTUMN','TREE_LARGE','BAMBOO_CLUSTER_01','BAMBOO_CLUSTER_02','BAMBOO_SMALL','PALM',
 'BUSH_GREEN','BUSH_FLOWER_PINK','BUSH_FLOWER_WHITE','BUSH_FLOWER_YELLOW','BUSH_FLOWER_PURPLE','BUSH_DENSE','GRASS_SHORT','GRASS_TALL',
 'GRASS_WILD','GRASS_FLOWERING','WEEDS_SMALL','WEEDS_TALL','FLOWERS_BLUE','FLOWERS_PINK','FLOWERS_WHITE','FLOWERS_YELLOW',
 'FLOWERS_PURPLE','FLOWERS_ORANGE','REEDS_01','REEDS_02','CATTAILS','LILY_PAD','LILY_FLOWER','WATER_GRASS',
 'ROCK_SMALL','ROCK_MEDIUM','ROCK_LARGE','ROCK_CLUSTER','ROCK_MOSS','CLIFF_ROCK_DETAIL','FALLEN_LOG','TREE_STUMP',
 'BRANCHES','MUSHROOM_CLUSTER','HOLLOW_LOG','CHERRY_TREE','OLD_TREE','HOLLOW_TREE','SWING_TREE','LANTERN_TREE',
 'BLUE_BUTTERFLY','YELLOW_BUTTERFLY','PINK_BUTTERFLY','ORANGE_BUTTERFLY','LEAVES','PETALS_PINK','PETALS_WHITE','FIREFLY',
] as const;
export type VegetationName=typeof VEGETATION_NAMES[number];
export interface Plant {name:VegetationName;x:number;y:number;height:number;width:number;solid:boolean;ground:boolean;biome:string;sway:boolean;}
export interface VegetationPlan {plants:Plant[];obstacles:Polygon[];}
const reserves=zones.filter(z=>!['northForest','pandaSanctuary','woodland','beach','lakeIsland','fishingArea'].includes(z.id));
const clearPoints=[...gatheringPoints,...Object.values(celebrationHumans),...zones.map(z=>z.center)];
export function waterAt(x:number,y:number){return rawWater.some(p=>inside([x,y],p))&&!islands.some(i=>inside([x,y],i.shape));}
export function dryAt(x:number,y:number){return x>12&&y>12&&x<MAP.width-12&&y<MAP.height-12&&(inside([x,y],mainland)||islands.some(i=>inside([x,y],i.shape)))&&!waterAt(x,y)&&!cliffFaces.some(p=>inside([x,y],p));}
function segmentDistance(p:Point,a:Point,b:Point){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);}
export function roadDistance(x:number,y:number){let distance=Infinity;for(const r of roads)for(let i=1;i<r.line.length;i++)distance=Math.min(distance,segmentDistance([x,y],r.line[i-1],r.line[i])-r.width/2);return distance;}
function protectedAt(x:number,y:number,margin:number){
 if(reserves.some(z=>inside([x,y],z.shape)))return true;
 if(clearPoints.some(p=>Math.hypot(x-p[0],y-p[1])<margin+30))return true;
 if([...bridges,...ramps].some(b=>segmentDistance([x,y],b.from,b.to)<margin+42))return true;
 return roadDistance(x,y)<margin;
}
export function footprint(p:Plant):Polygon {
 const rx=p.name.startsWith('BAMBOO')?p.width*.25:p.name.includes('ROCK')?p.width*.34:p.name.includes('LOG')?p.width*.36:p.width*.10;
 const ry=p.name.startsWith('BAMBOO')?10:p.name.includes('ROCK')?p.height*.16:6;
 return rectangle(p.x-rx,p.y-ry,rx*2,ry*2);
}
export function createVegetationPlan():VegetationPlan {
 let state=0x504f4c32;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const plants:Plant[]=[],obstacles:Polygon[]=[];
 const add=(name:VegetationName,x:number,y:number,biome:string,ground=false,shore=false)=>{
  const tree=(name.startsWith('TREE_')&&name!=='TREE_STUMP')||name.endsWith('_TREE')||name.startsWith('PINE')||name==='PALM',bamboo=name.startsWith('BAMBOO');
  const solid=tree||bamboo&&name!=='BAMBOO_SMALL'||['ROCK_LARGE','ROCK_CLUSTER','ROCK_MOSS','CLIFF_ROCK_DETAIL','FALLEN_LOG','HOLLOW_LOG','TREE_STUMP'].includes(name);
  x=Math.round(x);y=Math.round(y);
  const height=tree?(name==='TREE_LARGE'||name==='OLD_TREE'?156:name==='PALM'?120:116):bamboo?(name==='BAMBOO_SMALL'?64:128):name.includes('ROCK')?(name==='ROCK_SMALL'?14:name==='CLIFF_ROCK_DETAIL'?62:40):name.includes('LOG')?34:name==='TREE_STUMP'?26:name.includes('BUSH')?34:name.startsWith('LILY')?18:name==='CATTAILS'||name.startsWith('REEDS')?43:20;
  const flowerSize=name.startsWith('FLOWERS_')?[12,20,30][Math.floor(random()*3)]:height;
  const h=flowerSize*(.88+random()*.24),w=h*(bamboo?.52:name==='PALM'?.88:tree?.84:name.includes('LOG')?1.9:1);
  if(protectedAt(x,y,solid?Math.max(20,w*.28):8))return;
  if(reserves.some(z=>[[0,0],[-w*.5,-h*.5],[w*.5,-h*.5],[-w*.5,0],[w*.5,0],[0,-h*.9]].some(([dx,dy])=>inside([x+dx,y+dy],z.shape))))return;
  if(shore){if(!waterAt(x,y)||![[16,0],[-16,0],[0,16],[0,-16],[30,0],[-30,0],[0,30],[0,-30]].some(([dx,dy])=>dryAt(x+dx,y+dy)))return;}
  else if(!dryAt(x,y)||solid&&![[w*.12,0],[-w*.12,0],[0,10],[0,-10]].every(([dx,dy])=>dryAt(x+dx,y+dy)))return;
  if(solid&&plants.some(p=>p.solid&&Math.hypot(p.x-x,p.y-y)<(p.width+w)*.27))return;
  const p:Plant={name,x:Math.round(x),y:Math.round(y),height:h,width:w,solid,ground,biome,sway:!ground&&(name==='GRASS_TALL'||name==='REEDS_01')&&random()<.18};
  plants.push(p);if(solid)obstacles.push(footprint(p));
 };
 // Authored grove centers; seeded offsets give each grove gaps and uneven silhouettes.
 const groves:Array<[number,number,number,number,string,VegetationName[]]>=[
  [130,50,180,42,'north',['TREE_GREEN_01','PINE_01','PINE_02','TREE_GREEN_03']],
  [450,44,95,30,'north',['PINE_01','PINE_02','TREE_GREEN_02']],
  [780,45,150,35,'north',['PINE_01','PINE_02','TREE_GREEN_01','TREE_LARGE']],
  [1050,45,140,35,'north',['PINE_01','PINE_02','TREE_GREEN_03']],
  [1350,95,170,85,'north',['TREE_GREEN_01','PINE_01','TREE_GREEN_02']],
  [1150,190,135,105,'woodland',['TREE_GREEN_01','TREE_GREEN_02','FRUIT_TREE_01','PINE_02']],
  [230,180,120,67,'panda',['BAMBOO_CLUSTER_01','BAMBOO_CLUSTER_02','BAMBOO_SMALL']],
  [145,225,95,80,'panda',['BAMBOO_CLUSTER_01','BAMBOO_CLUSTER_02','TREE_GREEN_03']],
  [70,380,60,120,'west',['TREE_GREEN_01','TREE_GREEN_02','PINE_02']],
  [425,215,80,50,'garden',['FRUIT_TREE_01','TREE_GREEN_03','FRUIT_TREE_02']],
  [690,270,90,90,'river',['TREE_GREEN_01','TREE_GREEN_02']],
  [865,245,80,40,'garden',['TREE_GREEN_02','FRUIT_TREE_02']],
  [1260,370,150,65,'east',['TREE_GREEN_01','TREE_GREEN_03','FRUIT_TREE_01']],
  [690,640,80,85,'lake',['TREE_GREEN_01','TREE_GREEN_02']],
  [890,750,160,40,'south',['TREE_GREEN_01','TREE_GREEN_03']],
  [1280,755,150,40,'south',['TREE_GREEN_02','FRUIT_TREE_02']],
  [70,690,70,90,'coast',['PALM','TREE_GREEN_01']],
  [360,885,200,45,'coast',['PALM']],
  [430,727,75,42,'coast',['PALM']],
 ];
 for(const [cx,cy,rx,ry,biome,names] of groves){const count=biome==='north'?42:biome==='panda'?55:biome==='coast'?14:24;
  for(let i=0;i<count;i++){const angle=random()*Math.PI*2,r=Math.sqrt(random());add(names[Math.floor(random()*names.length)],(cx+Math.cos(angle)*rx*r)*2,(cy+Math.sin(angle)*ry*r)*2,biome);}
 }
 const landmarks:Array<[VegetationName,number,number]>=[['OLD_TREE',830,38],['HOLLOW_TREE',1070,200],['SWING_TREE',750,590],['LANTERN_TREE',330,180],['CHERRY_TREE',440,375],['TREE_BLOSSOM_PINK',920,554],['TREE_BLOSSOM_WHITE',325,355],['TREE_BLOSSOM_PURPLE',1240,570],['TREE_AUTUMN',1070,725],['TREE_LARGE',1310,165]];
 for(const [name,x,y] of landmarks){
  const before=plants.length;add(name,x*2,y*2,'landmark');
  for(let radius=24;plants.length===before&&radius<=220;radius+=24)for(let i=0;i<16&&plants.length===before;i++){
   const angle=i*Math.PI/8;add(name,x*2+Math.cos(angle)*radius,y*2+Math.sin(angle)*radius,'landmark');
  }
 }
 // Groundcover follows habitats and path margins, never the reserved parcels.
 for(let i=0;i<12500;i++){
  const x=random()*MAP.width,y=random()*MAP.height;if(!dryAt(x,y))continue;
  const panda=inside([x,y],zoneById.pandaSanctuary.shape),north=y<330,coast=y>1580,lakeEdge=[[24,0],[-24,0],[0,24],[0,-24],[46,0],[-46,0],[0,46],[0,-46]].some(([dx,dy])=>waterAt(x+dx,y+dy));
  const cliff=cliffFaces.some(poly=>inside([x,y+28],poly)),edge=roadDistance(x,y)<65;
  if(!north&&!panda&&!lakeEdge&&!cliff&&!edge&&random()>.30)continue;
  const patch=Math.sin(x/39+y/83)+Math.cos(y/47-x/111);if(!lakeEdge&&patch<-.7&&random()>.22)continue;
  const names:VegetationName[]=panda?['FLOWERS_WHITE','BUSH_FLOWER_WHITE','GRASS_WILD','ROCK_SMALL','BAMBOO_SMALL']:coast?['GRASS_SHORT','WEEDS_SMALL','ROCK_SMALL','BRANCHES']:lakeEdge?['REEDS_01','REEDS_02','CATTAILS','WATER_GRASS','ROCK_MOSS','GRASS_TALL']:cliff?['ROCK_SMALL','CLIFF_ROCK_DETAIL','BUSH_GREEN','GRASS_WILD','FLOWERS_PURPLE']:north?['BUSH_DENSE','BUSH_GREEN','GRASS_TALL','GRASS_WILD','ROCK_MEDIUM','MUSHROOM_CLUSTER','FALLEN_LOG','HOLLOW_LOG','TREE_STUMP']:['FLOWERS_PINK','FLOWERS_YELLOW','FLOWERS_BLUE','FLOWERS_WHITE','FLOWERS_PURPLE','FLOWERS_ORANGE','BUSH_FLOWER_PINK','BUSH_FLOWER_YELLOW','BUSH_FLOWER_PURPLE','GRASS_SHORT','GRASS_FLOWERING','WEEDS_TALL','WEEDS_SMALL'];
  const name=names[Math.floor(random()*names.length)];add(name,x,y,panda?'panda':coast?'coast':lakeEdge?'shore':north?'north':cliff?'cliff':'garden',!name.startsWith('REEDS')&&!['CATTAILS','BAMBOO_SMALL','GRASS_TALL','ROCK_MOSS','CLIFF_ROCK_DETAIL','FALLEN_LOG','HOLLOW_LOG','TREE_STUMP'].includes(name));
 }
 for(const river of rivers)for(let i=2;i<river.line.length-1;i+=3){
  const a=river.line[i-1],b=river.line[i+1],p=river.line[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
  for(const side of [-1,1]){const offset=river.width*2-5;add(i%2?'REEDS_01':'WATER_GRASS',p[0]+side*(b[1]-a[1])/length*offset,p[1]-side*(b[0]-a[0])/length*offset,'shore',false,true);}
 }
 for(let i=0;i<3000;i++){const x=360+random()*840,y=1040+random()*600;add(random()<.3?'LILY_FLOWER':'LILY_PAD',x,y,'water',true,true);}
 // Keep the lake approach readable: relocate the deterministic moss rock that visually sits on the path after duck-east-bridge.
 const pathRockIndex=plants.findIndex(p=>p.name==='ROCK_MOSS'&&p.x===425&&p.y===1471);
 if(pathRockIndex>=0){const p=plants[pathRockIndex],obstacleIndex=plants.slice(0,pathRockIndex).filter(v=>v.solid).length;p.x=345;p.y=1450;obstacles[obstacleIndex]=footprint(p);}
 return {plants,obstacles};
}
