import Phaser from 'phaser';
import { inside, type Polygon } from '../navigation';
import { MAP } from './mapConfig';
import type { WorldMasks } from './terrain';
import { drawGrass } from './grassArt';
/** A root/foot edge; future props can provide anchors without changing their collisions. */
export interface IntegrationAnchor {id:string;x:number;y:number;span:number;cover:number;kind?:'tree'|'rock'|'wood'|'flower'|'plant';wet?:boolean;depth?:number;}
const CELL_W=64,CELL_H=16,COLUMNS=16;
/** Static, precomposed root patches share one atlas; no GameObject for individual blades. */
export class ObjectIntegrationLayer {
 private objects:Phaser.GameObjects.Image[]=[];
 private nextCull=0;
 readonly textureBytes:number;
 constructor(scene:Phaser.Scene,private masks:WorldMasks,anchors:readonly IntegrationAnchor[],key='object-integration',private excluded:readonly Polygon[]=[]){
  const canvas=document.createElement('canvas');canvas.width=CELL_W*COLUMNS;canvas.height=CELL_H*Math.max(1,Math.ceil(anchors.length/COLUMNS));
  const ctx=canvas.getContext('2d',{willReadFrequently:true})!;ctx.imageSmoothingEnabled=false;
  const placements:Array<{anchor:IntegrationAnchor;index:number}>=[];
  anchors.forEach((anchor,index)=>{
   const cx=index%COLUMNS*CELL_W,cy=Math.floor(index/COLUMNS)*CELL_H;
   let state=(Math.imul(Math.round(anchor.x),73856093)^Math.imul(Math.round(anchor.y),19349663))>>>0;
   const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
   const span=Math.min(48,anchor.span/MAP.pixel),count=Math.max(4,Math.ceil(span/7))+Math.floor(random()*3);
   for(let i=0;i<count;i++){
    const x=Math.round(cx+CELL_W/2+(random()-.5)*span),y=cy+CELL_H-5+Math.floor(random()*2);
    const profile=anchor.cover<8?10:12+Math.floor(random()*3);
    ctx.globalAlpha=.85+random()*.15;
    drawGrass(ctx,x,y,profile,Math.floor(random()*4294967295),0,!!anchor.wet,anchor.cover/MAP.pixel);
    // A few native leaves and tiny blossom accents break the repeated tuft silhouette.
    if(i%3===0&&anchor.kind!=='rock'){
     ctx.fillStyle=anchor.wet?'#678646':'#85a34b';ctx.fillRect(x-2,y-2,2,1);ctx.fillStyle='#587b36';ctx.fillRect(x-1,y-3,1,1);
     if(anchor.kind==='flower'&&random()<.22){ctx.fillStyle='#ddc685';ctx.fillRect(x-2,y-3,1,1);}
    }
    ctx.globalAlpha=1;
   }
   // Pixel mask clips the front patches to their actual habitat, including path edges.
   const image=ctx.getImageData(cx,cy,CELL_W,CELL_H);let filled=false;
   for(let y=0;y<CELL_H;y++)for(let x=0;x<CELL_W;x++){
    const i=(y*CELL_W+x)*4;if(!image.data[i+3])continue;
    const wx=anchor.x+(x-CELL_W/2)*MAP.pixel,wy=anchor.y+(y-CELL_H+4)*MAP.pixel;
    if(!this.valid(wx,wy,!!anchor.wet)){image.data[i+3]=0;}else filled=true;
   }
   ctx.putImageData(image,cx,cy);if(filled)placements.push({anchor,index});
  });
  if(scene.textures.exists(key))scene.textures.remove(key);const texture=scene.textures.addCanvas(key,canvas)!;
  const groundChunks=new Map<string,{canvas:HTMLCanvasElement;x:number;y:number}>();
  for(const {anchor,index} of placements){
   const sx=index%COLUMNS*CELL_W,sy=Math.floor(index/COLUMNS)*CELL_H;
   if((anchor.depth??0)<0){
    const x=Math.floor(anchor.x/256)*128,y=Math.floor(anchor.y/256)*128,k=`${x}-${y}`;
    let chunk=groundChunks.get(k);if(!chunk){const c=document.createElement('canvas');c.width=c.height=192;chunk={canvas:c,x,y};groundChunks.set(k,chunk);}
    const c=chunk.canvas.getContext('2d')!;c.imageSmoothingEnabled=false;
    c.drawImage(canvas,sx,sy,CELL_W,CELL_H,Math.round(anchor.x/MAP.pixel-x),Math.round(anchor.y/MAP.pixel-y+32-CELL_H+4),CELL_W,CELL_H);
    continue;
   }
   texture.add(index,0,sx,sy,CELL_W,CELL_H);
   this.objects.push(scene.add.image(anchor.x-CELL_W,anchor.y-(CELL_H-4)*MAP.pixel,key,index).setOrigin(0).setScale(MAP.pixel).setDepth((anchor.depth??anchor.y)+.1));
  }
  for(const [k,chunk] of groundChunks){const chunkKey=`${key}-ground-${k}`;if(scene.textures.exists(chunkKey))scene.textures.remove(chunkKey);scene.textures.addCanvas(chunkKey,chunk.canvas);
   this.objects.push(scene.add.image((chunk.x-32)*MAP.pixel,(chunk.y-32)*MAP.pixel,chunkKey).setOrigin(0).setScale(MAP.pixel).setDepth(-7.9));
  }
  this.textureBytes=canvas.width*canvas.height*4+groundChunks.size*192*192*4;
 }
 private valid(x:number,y:number,_wet:boolean){
  if(this.excluded.some(p=>inside([x,y],p)))return false;
  const gx=Math.floor(x/MAP.pixel),gy=Math.floor(y/MAP.pixel),width=MAP.width/MAP.pixel;
  if(gx<0||gy<0||gx>=width||gy>=MAP.height/MAP.pixel)return false;
  const i=(gy*width+gx)*4,m=this.masks;
  if(m.paths[i+3]||m.cliffs[i+3])return false;
  if(m.water[i+3])return false;
  return m.land[i+3]>127&&[0,9,10,11].includes(m.surfaces[i]);
 }
 update(time:number,view:Phaser.Geom.Rectangle){if(time<this.nextCull)return;this.nextCull=time+180;for(const o of this.objects)o.setVisible(Phaser.Geom.Rectangle.Overlaps(view,o.getBounds()));}
 get diagnostics(){return {patches:this.objects.length,visible:this.objects.filter(o=>o.visible).length,estimatedTextureMiB:Math.round(this.textureBytes/1048576*10)/10,animated:0};}
}
