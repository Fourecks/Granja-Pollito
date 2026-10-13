import Phaser from 'phaser';
import { MAP } from './mapConfig';
import type { WorldMasks } from './terrain';
import type { VegetationPlan, Plant } from './vegetationPlan';
/** Static base transitions, sharing the ground-cover canvas and existing atlas. */
export function blendVegetationBases(scene:Phaser.Scene,ctx:CanvasRenderingContext2D,masks:WorldMasks,plan:VegetationPlan){
 const sheet=scene.textures.get('vegetation'),source=sheet.getSourceImage() as HTMLImageElement,width=MAP.width/2;
 let state=0x42415345;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const valid=(x:number,y:number,wet:boolean)=>{
  x=Math.round(x);y=Math.round(y);if(x<2||y<2||x>=width-2||y>=MAP.height/2-2)return false;
  const i=(y*width+x)*4;return masks.paths[i+3]===0&&masks.cliffs[i+3]===0&&(wet?masks.water[i+3]>0||masks.land[i+3]>127:masks.water[i+3]===0&&masks.land[i+3]>127&&[0,9,10,11].includes(masks.surfaces[i]));
 };
 const baseKind=(p:Plant)=>p.name.includes('BUSH')?'bush':p.name.startsWith('FLOWERS')?'flower':p.name.includes('REEDS')||p.name==='CATTAILS'?'wet':p.name.includes('ROCK')?'rock':p.name.includes('BAMBOO')?'bamboo':p.name==='BRANCHES'||p.name.includes('TREE')||p.name.includes('LOG')||p.name.startsWith('PINE')?'tree':null;
 for(const p of plan.plants){const kind=baseKind(p);if(!kind)continue;
  // Subtle, broken contact shadows only on valid terrain, baked with tiny base detail.
  if(kind!=='flower'&&valid(p.x/2,p.y/2,kind==='wet')){ctx.save();ctx.fillStyle='#334929';ctx.globalAlpha=.13;const span=Math.min(14,p.width*.14);for(let dx=-Math.floor(span);dx<=span;dx+=2)if(valid(p.x/2+dx,p.y/2,false))ctx.fillRect(Math.round(p.x/2+dx),Math.round(p.y/2),2,1);ctx.restore();}
  const count=kind==='flower'?3:kind==='bamboo'?7:4+Math.floor(random()*4);
  for(let i=0;i<count;i++){
   // Uneven offsets favour one side, never a ring repeated around every object.
   const x=p.x/2+(random()-.45)*Math.min(24,p.width*.45),y=p.y/2+(random()-.6)*8;
   const size=1+Math.floor(random()*3),wet=kind==='wet';
   if(![[0,0],[-size,-size],[size,0],[0,-size*2]].every(([dx,dy])=>valid(x+dx,y+dy,wet)))continue;
   let name=wet?'WATER_GRASS':kind==='bamboo'&&i%3===0?'LEAVES':'GRASS_SHORT';
   if(kind==='rock'&&random()<.18)name='ROCK_SMALL';
   if(kind==='tree'&&random()<.28)name='LEAVES';
   if(kind==='flower'&&i===0)name=p.name;
   const f=sheet.get(name);ctx.save();ctx.globalAlpha=wet?.72:.65+random()*.3;
   if(wet){ctx.fillStyle='#716940';ctx.globalAlpha=.22;ctx.fillRect(Math.round(x-size),Math.round(y-1),size*2,2);ctx.globalAlpha=.75;}
   const h=size*2,w=h*f.cutWidth/f.cutHeight;ctx.drawImage(source,f.cutX,f.cutY,f.cutWidth,f.cutHeight,x-w/2,y-h,w,h);ctx.restore();
  }
 }
}
