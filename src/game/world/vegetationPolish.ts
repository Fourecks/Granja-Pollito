import type { VisualPlant, OccupiedArea } from './vegetationOccupancy';
export const isTree=(p:VisualPlant)=>(p.name.includes('TREE')&&p.name!=='TREE_STUMP')||p.name.startsWith('PINE')||p.name==='PALM';
const noise=(x:number,y:number)=>{const n=Math.sin(x*12.9898+y*78.233)*43758.5453;return n-Math.floor(n);};
export const accentDensity=(x:number,y:number)=>(Math.sin(x/137+y/219)+Math.cos(y/103-x/281)+2)/4;
const canopy=(p:VisualPlant):OccupiedArea=>({left:p.x-p.drawWidth*.45,right:p.x+p.drawWidth*.45,top:p.y-p.height*.94,bottom:p.y-p.height*.28});
const overlap=(a:OccupiedArea,b:OccupiedArea)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
/** Draw-only art direction. Roots and every physical obstacle stay authored. */
export function polishVegetation(plants:VisualPlant[]){
 const trees=plants.filter(isTree),original=new Map(trees.map(p=>[p,{height:p.height,width:p.drawWidth}]));
 const swing=trees.find(p=>p.name==='SWING_TREE');
 // Prioritize landmarks, then keep crowns recognizable within the existing organic groves.
 const ordered=trees.slice().sort((a,b)=>Number(b.biome==='landmark')-Number(a.biome==='landmark')||a.y-b.y);
 for(let pass=0;pass<12;pass++)for(let i=0;i<ordered.length;i++)for(let j=i+1;j<ordered.length;j++){
  const a=ordered[i],b=ordered[j],ca=canopy(a),cb=canopy(b);
  const fraction=overlap(ca,cb)/Math.min((ca.right-ca.left)*(ca.bottom-ca.top),(cb.right-cb.left)*(cb.bottom-cb.top));
  if(fraction<.14)continue;
  const p=a.biome==='landmark'?b:b.biome==='landmark'?a:(noise(a.x,b.y)>.5?a:b),base=original.get(p)!;
  if(p.biome==='landmark'||p.height<=base.height*.62)continue;
  p.height=Math.max(base.height*.62,p.height*.96);p.drawWidth=base.width*p.height/base.height;
 }
 // Foreground crowns must not cover the rope/seat or the landmark's lower trunk.
 if(swing)for(const p of trees){if(p===swing||p.biome==='landmark')continue;
  const clear={left:swing.x-swing.drawWidth*.48,right:swing.x+swing.drawWidth*.48,top:swing.y-swing.height*.65,bottom:swing.y+12};
  const base=original.get(p)!;
  while(overlap(canopy(p),clear)>0&&p.y>swing.y-22&&p.height>base.height*.55){p.height=Math.max(base.height*.55,p.height*.94);p.drawWidth=base.width*p.height/base.height;}
 }
 let deadwoodReduced=0,flowersReduced=0,shoreReduced=0;
 const result=plants.filter(p=>{
  if(p.name.includes('LOG')||p.name==='TREE_STUMP'){
   // Retain a visible low remnant over its existing collider rather than an invisible obstacle.
   if(noise(p.x,p.y)<.36){p.name='BRANCHES';p.height=10;p.ground=false;deadwoodReduced++;}
  }
  const ordinary=p.name.startsWith('FLOWERS_')||p.name.startsWith('BUSH_FLOWER_')||p.name==='GRASS_FLOWERING';
  if(ordinary&&noise(p.x+71,p.y)>.56+accentDensity(p.x,p.y)*.33){flowersReduced++;return false;}
  const waterside=p.biome==='shore'||p.biome==='water';
  if(waterside&&!p.solid&&!p.name.includes('ROCK')&&accentDensity(p.x+190,p.y+240)<.22){shoreReduced++;return false;}
  if(swing&&!p.solid&&Math.hypot(p.x-swing.x,p.y-swing.y)<58&&p.height>15)return false;
  return true;
 });
 return {plants:result,deadwoodReduced,flowersReduced,shoreReduced,treeSilhouettes:trees.filter(p=>p.height<original.get(p)!.height).length};
}
