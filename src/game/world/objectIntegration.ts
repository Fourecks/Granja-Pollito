import Phaser from 'phaser';
import { MAP } from './mapConfig';
import type { WorldMasks } from './terrain';
/** A root/foot edge; future props can provide anchors without changing their collisions. */
export interface IntegrationAnchor {id:string;x:number;y:number;span:number;cover:number;wet?:boolean;depth?:number;}
const CELL_W=64,CELL_H=16,COLUMNS=16;
/** Static, precomposed root patches share one atlas; no GameObject for individual blades. */
export class ObjectIntegrationLayer {
 private objects:Phaser.GameObjects.Image[]=[];
 private nextCull=0;
 readonly textureBytes:number;
 constructor(scene:Phaser.Scene,private masks:WorldMasks,anchors:readonly IntegrationAnchor[],key='object-integration'){
  const canvas=document.createElement('canvas');canvas.width=CELL_W*COLUMNS;canvas.height=CELL_H*Math.max(1,Math.ceil(anchors.length/COLUMNS));
  const ctx=canvas.getContext('2d',{willReadFrequently:true})!;ctx.imageSmoothingEnabled=false;
  const grass=scene.textures.get('micro-grass'),ground=scene.textures.get('vegetation');
  const grassSource=grass.getSourceImage() as HTMLImageElement,groundSource=ground.getSourceImage() as HTMLImageElement;
  const placements:Array<{anchor:IntegrationAnchor;index:number}>=[];
  anchors.forEach((anchor,index)=>{
   const cx=index%COLUMNS*CELL_W,cy=Math.floor(index/COLUMNS)*CELL_H;
   let state=(Math.imul(Math.round(anchor.x),73856093)^Math.imul(Math.round(anchor.y),19349663))>>>0;
   const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
   const span=Math.min(48,anchor.span/MAP.pixel),count=3+Math.floor(random()*5);
   for(let i=0;i<count;i++){
    const leaf=random()<.17&&!anchor.wet,sheet=leaf?ground:grass,source=leaf?groundSource:grassSource;
    const frame=sheet.get(leaf?'LEAVES':`grass_idle_${Math.floor(random()*4)}`);
    const h=Math.min(5,anchor.cover/MAP.pixel)*(.6+random()*.4),w=h*frame.cutWidth/frame.cutHeight;
    const x=CELL_W/2+(random()-.5)*span,y=CELL_H-3+random()*2;
    ctx.save();ctx.globalAlpha=.75+random()*.25;ctx.translate(cx+x,cy+y);if(random()<.5)ctx.scale(-1,1);
    ctx.drawImage(source,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,-w/2,-h,w,h);ctx.restore();
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
  for(const {anchor,index} of placements){texture.add(index,0,index%COLUMNS*CELL_W,Math.floor(index/COLUMNS)*CELL_H,CELL_W,CELL_H);
   this.objects.push(scene.add.image(anchor.x-CELL_W,anchor.y-(CELL_H-4)*MAP.pixel,key,index).setOrigin(0).setScale(MAP.pixel).setDepth((anchor.depth??anchor.y)+.1));
  }
  this.textureBytes=canvas.width*canvas.height*4;
 }
 private valid(x:number,y:number,wet:boolean){
  const gx=Math.floor(x/MAP.pixel),gy=Math.floor(y/MAP.pixel),width=MAP.width/MAP.pixel;
  if(gx<0||gy<0||gx>=width||gy>=MAP.height/MAP.pixel)return false;
  const i=(gy*width+gx)*4,m=this.masks;
  if(m.paths[i+3]||m.cliffs[i+3])return false;
  if(m.water[i+3]){
   if(!wet)return false;
   // Wet roots only at an actual shallow edge, never isolated in the river/lake.
   return [[8,0],[-8,0],[0,8],[0,-8]].some(([dx,dy])=>{const xx=gx+dx,yy=gy+dy,j=(yy*width+xx)*4;return xx>=0&&yy>=0&&xx<width&&yy<MAP.height/MAP.pixel&&m.land[j+3]>127&&!m.water[j+3];});
  }
  return m.land[i+3]>127&&[0,9,10,11].includes(m.surfaces[i]);
 }
 update(time:number,view:Phaser.Geom.Rectangle){if(time<this.nextCull)return;this.nextCull=time+180;for(const o of this.objects)o.setVisible(Phaser.Geom.Rectangle.Overlaps(view,o.getBounds()));}
 get diagnostics(){return {patches:this.objects.length,visible:this.objects.filter(o=>o.visible).length,estimatedTextureMiB:Math.round(this.textureBytes/1048576*10)/10,animated:0};}
}
