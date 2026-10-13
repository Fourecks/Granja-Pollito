import { naturalHeight } from './naturalScale';
import { isTree, polishVegetation } from './vegetationPolish';
import atlas from '../../../public/assets/vegetation-atlas.json';
import { footprint, type Plant, type VegetationPlan } from './vegetationPlan';
export interface OccupiedArea {left:number;right:number;top:number;bottom:number;}
export interface VisualPlant extends Plant {drawWidth:number;occupied?:OccupiedArea;}
const frames=atlas.frames as Record<string,{frame:{w:number;h:number}}>;
export function overlaps(a:OccupiedArea,b:OccupiedArea,gap=0){return a.left<b.right+gap&&a.right>b.left-gap&&a.top<b.bottom+gap&&a.bottom>b.top-gap;}
const union=(a:OccupiedArea,b:OccupiedArea):OccupiedArea=>({left:Math.min(a.left,b.left),right:Math.max(a.right,b.right),top:Math.min(a.top,b.top),bottom:Math.max(a.bottom,b.bottom)});
const rockBody=(members:Plant[])=>members.map(p=>{const f=frames[p.name].frame,w=p.height*f.w/f.h;return {left:p.x-w*.47,right:p.x+w*.47,top:p.y-p.height*.90,bottom:p.y+3};}).reduce(union);
const physical=(p:Plant):OccupiedArea=>{const f=footprint(p);return {left:Math.min(...f.map(p=>p[0])),right:Math.max(...f.map(p=>p[0])),top:Math.min(...f.map(p=>p[1])),bottom:Math.max(...f.map(p=>p[1]))};};
export function structural(p:Plant){return p.solid||isTree({...p,drawWidth:p.width})||p.name.startsWith('BUSH_')||p.name==='ROCK_MEDIUM'||p.name==='BAMBOO_SMALL';}
/** Display occupancy is independent of navigation: all original collision polygons survive. */
export function resolveVegetationOccupancy(plan:VegetationPlan){
 const solids=plan.plants.filter(p=>p.solid),groups:Array<{members:Plant[];area:OccupiedArea}>=[];
 for(const p of solids){let group={members:[p],area:physical(p)};
  for(let i=0;i<groups.length;){const combined=union(group.area,groups[i].area),rockPair=[...group.members,...groups[i].members].every(p=>p.name.includes('ROCK'))&&group.members.length+groups[i].members.length<=3&&combined.right-combined.left<120&&combined.bottom-combined.top<100;
   if(overlaps(group.area,groups[i].area)||(rockPair&&overlaps(rockBody(group.members),rockBody(groups[i].members)))){group={members:[...group.members,...groups[i].members],area:union(group.area,groups[i].area)};groups.splice(i,1);i=0;}else i++;}
  groups.push(group);
 }
 const result:VisualPlant[]=[],occupied:OccupiedArea[]=[];
 for(const group of groups){
  const primary=group.members.slice().sort((a,b)=>b.height-a.height)[0];
  const name=group.members.length>1&&group.members.every(p=>p.name.includes('ROCK'))?'ROCK_CLUSTER':primary.name;
  const frame=frames[name].frame;
  // A reserved collision union is not a request to stretch/enlarge its visual model.
  const height=naturalHeight({...primary,name});
  const width=height*frame.w/frame.h;
  const plant:VisualPlant={...primary,name,height,x:group.members.length>1?(group.area.left+group.area.right)/2:primary.x,y:group.members.length>1?Math.max(...group.members.map(p=>p.y)):primary.y,drawWidth:width,ground:false,occupied:group.area};
  result.push(plant);occupied.push(group.area);
 }
 let suppressed=0;
 // Every ground-volume decoration gets its full projected body as a keep-clear area.
 // Reject it if it crosses the base/body of an existing structural object.
 const blockers=result.map(p=>{
  const trunk=p.name.includes('TREE')&&p.name!=='TREE_STUMP'||p.name.startsWith('PINE')||p.name==='PALM';
  const body=trunk?{left:p.x-p.drawWidth*.13,right:p.x+p.drawWidth*.13,top:p.y-p.height*.20,bottom:p.y+5}:{left:p.x-p.drawWidth*.47,right:p.x+p.drawWidth*.47,top:p.y-p.height*.86,bottom:p.y+3};
  return union(body,p.occupied!);
 });
 for(const original of plan.plants.filter(p=>!p.solid)){
  const p={...original,height:naturalHeight(original)};
  const f=frames[p.name].frame,width=p.height*f.w/f.h;
  const large=structural(p),tall=p.name.startsWith('REEDS')||p.name==='CATTAILS'||p.name==='GRASS_TALL';
  const area={left:p.x-width*.47,right:p.x+width*.47,top:p.y-p.height*.94,bottom:p.y+2};
  const smallFlower=p.name.startsWith('FLOWERS_')||p.name==='GRASS_FLOWERING';
  const rootArea={left:p.x-width*.25,right:p.x+width*.25,top:p.y-3,bottom:p.y+2};
  if(((large||tall)&&blockers.some(a=>overlaps(area,a,large?5:2)))||(smallFlower&&blockers.some(a=>overlaps(rootArea,a)))){suppressed++;continue;}
  if(large){blockers.push(area);occupied.push(area);}
  result.push({...p,drawWidth:width,ground:large?false:p.ground,occupied:large?area:undefined});
 }
 const polish=polishVegetation(result);
 for(const p of polish.plants){const f=frames[p.name].frame;p.drawWidth=p.height*f.w/f.h;}
 return {...polish,occupied,suppressed,merged:solids.length-groups.length,structuralCount:occupied.length};
}
