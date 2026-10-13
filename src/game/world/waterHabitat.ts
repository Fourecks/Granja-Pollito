import { MAP, waterfalls, bridges, ramps } from './mapConfig';
import { inside } from '../navigation';
import type { WorldMasks } from './terrain';
import type { VisualPlant } from './vegetationOccupancy';
export const isTallReed=(name:string)=>name==='CATTAILS'||name==='REEDS_01'||name==='REEDS_02';
/** Native-pixel shore distance shared by water shading and dry-root placement. */
export class WaterHabitat {
 readonly width=MAP.width/MAP.pixel;
 readonly height=MAP.height/MAP.pixel;
 readonly distance:Uint16Array;
 constructor(readonly masks:WorldMasks){
  const w=this.width,h=this.height,d=this.distance=new Uint16Array(w*h);
  for(let i=0;i<d.length;i++)d[i]=masks.water[i*4+3]>127?30000:0;
  // Two chamfer passes: straight=3, diagonal=4 (approximate Euclidean distance).
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(!d[i])continue;
   if(x)d[i]=Math.min(d[i],d[i-1]+3);if(y)d[i]=Math.min(d[i],d[i-w]+3);
   if(x&&y)d[i]=Math.min(d[i],d[i-w-1]+4);if(x+1<w&&y)d[i]=Math.min(d[i],d[i-w+1]+4);
  }
  for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){const i=y*w+x;if(!d[i])continue;
   if(x+1<w)d[i]=Math.min(d[i],d[i+1]+3);if(y+1<h)d[i]=Math.min(d[i],d[i+w]+3);
   if(x+1<w&&y+1<h)d[i]=Math.min(d[i],d[i+w+1]+4);if(x&&y+1<h)d[i]=Math.min(d[i],d[i+w-1]+4);
  }
 }
 index(x:number,y:number){const gx=Math.floor(x/MAP.pixel),gy=Math.floor(y/MAP.pixel);return gx<0||gy<0||gx>=this.width||gy>=this.height?-1:gy*this.width+gx;}
 depthAt(x:number,y:number){const i=this.index(x,y);return i<0?Infinity:this.distance[i]/3;}
 green(x:number,y:number){const i=this.index(x,y)*4,m=this.masks;return i>=0&&m.land[i+3]>127&&!m.water[i+3]&&!m.paths[i+3]&&!m.cliffs[i+3]&&[0,9,10,11].includes(m.surfaces[i]);}
 private shoreRoot(x:number,y:number){
  if(!this.green(x,y))return false;
  if([...bridges,...ramps].some(b=>inside([x,y],b.shape)))return false;
  if(waterfalls.some(f=>Math.abs(x-f.position[0])<f.width+12&&y>f.position[1]-12&&y<f.position[1]+f.height*2+12))return false;
  return [[6,0],[-6,0],[0,6],[0,-6],[10,0],[-10,0],[0,10],[0,-10]].some(([dx,dy])=>{const i=this.index(x+dx,y+dy);return i>=0&&this.masks.water[i*4+3]>127;});
 }
 placeTallReeds(plants:readonly VisualPlant[]){
  let relocated=0,removed=0;const roots:Array<{x:number;y:number}>=[];
  const result:VisualPlant[]=[];
  for(const p of plants){if(!isTallReed(p.name)){result.push(p);continue;}
   let root:{x:number;y:number}|undefined;
   if(this.shoreRoot(p.x,p.y))root={x:p.x,y:p.y};
   else{let best=Infinity;for(let dy=-44;dy<=44;dy+=2)for(let dx=-44;dx<=44;dx+=2){const distance=dx*dx+dy*dy;if(distance>=best)continue;const x=p.x+dx,y=p.y+dy;
    if(this.shoreRoot(x,y)&&!roots.some(r=>Math.hypot(r.x-x,r.y-y)<14)){root={x,y};best=distance;}
   }}
   if(!root||roots.some(r=>Math.hypot(r.x-root!.x,r.y-root!.y)<12)){removed++;continue;}
   if(root.x!==p.x||root.y!==p.y)relocated++;
   roots.push(root);result.push({...p,...root,ground:false});
  }
  return {plants:result,relocated,removed};
 }
}
