import type { VisualPlant } from './vegetationOccupancy';
export const isTree=(p:VisualPlant)=>(p.name.includes('TREE')&&p.name!=='TREE_STUMP')||p.name.startsWith('PINE')||p.name==='PALM';
const noise=(x:number,y:number)=>{const n=Math.sin(x*12.9898+y*78.233)*43758.5453;return n-Math.floor(n);};
export const accentDensity=(x:number,y:number)=>(Math.sin(x/137+y/219)+Math.cos(y/103-x/281)+2)/4;
/** Draw-only polish retains adult scale and the authored root positions. */
export function polishVegetation(plants:VisualPlant[]){
 const swing=plants.find(p=>p.name==='SWING_TREE');
 const deadwoodReduced=0;let flowersReduced=0,shoreReduced=0;
 const result=plants.filter(p=>{
  const ordinary=p.name.startsWith('FLOWERS_')||p.name.startsWith('BUSH_FLOWER_')||p.name==='GRASS_FLOWERING';
  if(ordinary&&noise(p.x+71,p.y)>.56+accentDensity(p.x,p.y)*.33){flowersReduced++;return false;}
  const waterside=p.biome==='shore'||p.biome==='water';
  if(waterside&&!p.solid&&!p.name.includes('ROCK')&&accentDensity(p.x+190,p.y+240)<.22){shoreReduced++;return false;}
  if(swing&&!p.solid&&Math.hypot(p.x-swing.x,p.y-swing.y)<58&&p.height>15)return false;
  return true;
 });
 return {plants:result,deadwoodReduced,flowersReduced,shoreReduced,treeSilhouettes:0};
}
