import Phaser from 'phaser';
import { MAP, bridges, ramps } from './mapConfig';
import { zones } from './zones';
import type { WorldMasks } from './terrain';
import type { VegetationPlan } from './vegetationPlan';
import { WindSystem, type WindVariation } from './wind';
interface Tuft {x:number;y:number;variant:number;size:number;animated:boolean;offset:number;}
interface GrassChunk {staticImage:Phaser.GameObjects.Image;animatedImage?:Phaser.GameObjects.Image;variation:WindVariation;nextFrame:number;}
const PIXEL=MAP.pixel,CHUNK=MAP.chunk/PIXEL;
export class MicroGrassLayer {
 private chunks:GrassChunk[]=[];
 private visible:GrassChunk[]=[];
 private nextCull=0;
 readonly count:number;
 readonly animatedCount:number;
 constructor(private scene:Phaser.Scene,masks:WorldMasks,plan:VegetationPlan,readonly wind:WindSystem){
  const width=MAP.width/PIXEL,height=MAP.height/PIXEL;
  let state=0x47524153;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  const tufts:Tuft[]=[];
  const green=(x:number,y:number)=>{
   if(x<0||y<0||x>=width||y>=height)return false;
   const i=(y*width+x)*4;
   return masks.land[i+3]>127&&masks.water[i+3]===0&&masks.cliffs[i+3]===0&&masks.paths[i+3]===0&&[0,9,10,11].includes(masks.surfaces[i]);
  };
  // Coarse occupancy lookup avoids adding noise underneath existing clusters.
  const occupied=new Set<string>();for(const p of plan.plants)occupied.add(`${Math.floor(p.x/24)},${Math.floor(p.y/24)}`);
  const rest=zones.flatMap(z=>[z.approach,...(z.legacyObject?[z.center]:[])]);
  const crossings=[...bridges,...ramps];
  for(let i=0;i<62000;i++){
   const x=Math.floor(random()*width),y=Math.floor(random()*height),wx=x*PIXEL,wy=y*PIXEL;
   const material=masks.surfaces[(y*width+x)*4],forest=material===11,panda=material===10,farm=material===9;
   const patch=(Math.sin(x/(forest?19:27)+y/67)+Math.cos(y/(panda?29:39)-x/79)+2)/4;
   if(random()>.16+patch*.62)continue;
   if(y>760&&random()>.7)continue;
   if(farm&&random()>.85)continue;
   const size=3+Math.floor(random()*3);
   let clear=true;for(let dy=-size*2;dy<=1&&clear;dy++)for(let dx=-size;dx<=size;dx++)if(!green(x+dx,y+dy)){clear=false;break;}
   if(!clear)continue;
   if(occupied.has(`${Math.floor(wx/24)},${Math.floor(wy/24)}`))continue;
   if(rest.some(([px,py])=>Math.hypot(wx-px,wy-py)<65))continue;
   if(crossings.some(c=>Math.hypot(wx-c.from[0],wy-c.from[1])<65||Math.hypot(wx-c.to[0],wy-c.to[1])<65))continue;
   // Keep looser edges around paths and the plaza even inside green masks.
   if(!green(x-8,y)||!green(x+8,y)||!green(x,y-8)||!green(x,y+8))continue;
   tufts.push({x,y,variant:forest?2:panda?random()<.5?1:2:farm?Math.floor(random()*2):Math.floor(random()*4),size,animated:random()<.18,offset:Math.floor(random()*4)});
  }
  this.count=tufts.length;this.animatedCount=tufts.filter(t=>t.animated).length;
  const atlas=scene.textures.get('micro-grass'),source=atlas.getSourceImage() as HTMLImageElement;
  const draw=(ctx:CanvasRenderingContext2D,t:Tuft,frame:number,cx:number,cy:number)=>{
   const f=atlas.get(`grass_${['idle','sway_1','sway_2','sway_3'][frame]}_${t.variant}`);
   ctx.drawImage(source,f.cutX,f.cutY,f.cutWidth,f.cutHeight,t.x-cx-t.size,t.y-cy-t.size*2,t.size*2,t.size*2);
  };
  for(let cy=0;cy<height;cy+=CHUNK)for(let cx=0;cx<width;cx+=CHUNK){
   const local=tufts.filter(t=>t.x>=cx&&t.x<cx+CHUNK&&t.y>=cy&&t.y<cy+CHUNK);if(!local.length)continue;
   // Padding lets tufts straddle chunk boundaries without clipping their tips.
   const padding=12,side=CHUNK+padding*2;
   const staticCanvas=document.createElement('canvas');staticCanvas.width=staticCanvas.height=side;
   const ctx=staticCanvas.getContext('2d')!;ctx.imageSmoothingEnabled=false;
   for(const t of local.filter(t=>!t.animated))draw(ctx,t,0,cx-padding,cy-padding);
   const key=`micro-grass-static-${cx}-${cy}`;if(scene.textures.exists(key))scene.textures.remove(key);scene.textures.addCanvas(key,staticCanvas);
   const staticImage=scene.add.image((cx-padding)*PIXEL,(cy-padding)*PIXEL,key).setOrigin(0).setScale(PIXEL).setDepth(-15);
   const chunk:GrassChunk={staticImage,variation:wind.variation(cx,cy),nextFrame:0};
   const moving=local.filter(t=>t.animated);
   if(moving.length){
    const framesCanvas=document.createElement('canvas');framesCanvas.width=side*5;framesCanvas.height=side;
    const frameCtx=framesCanvas.getContext('2d')!;frameCtx.imageSmoothingEnabled=false;
    // Frame 0 is genuinely still. Four animated batches use independent tuft phases.
    for(let frame=0;frame<5;frame++){frameCtx.save();frameCtx.translate(side*frame,0);
     for(const t of moving)draw(frameCtx,t,frame===0?0:(frame-1+t.offset)%4,cx-padding,cy-padding);frameCtx.restore();}
    const animatedKey=`micro-grass-sway-${cx}-${cy}`;if(scene.textures.exists(animatedKey))scene.textures.remove(animatedKey);
    const texture=scene.textures.addCanvas(animatedKey,framesCanvas)!;for(let frame=0;frame<5;frame++)texture.add(frame,0,side*frame,0,side,side);
    chunk.animatedImage=scene.add.image((cx-padding)*PIXEL,(cy-padding)*PIXEL,animatedKey,0).setOrigin(0).setScale(PIXEL).setDepth(-14.9);
   }
   this.chunks.push(chunk);
  }
 }
 update(time:number){
  if(time>=this.nextCull){this.nextCull=time+180;const view=this.scene.cameras.main.worldView;this.visible=[];
   for(const chunk of this.chunks){const visible=Phaser.Geom.Rectangle.Overlaps(view,chunk.staticImage.getBounds());chunk.staticImage.setVisible(visible);chunk.animatedImage?.setVisible(visible);if(visible)this.visible.push(chunk);}
  }
  for(const chunk of this.visible){if(!chunk.animatedImage||time<chunk.nextFrame)continue;
   chunk.nextFrame=time+180/chunk.variation.speed;
   const response=this.wind.response('grass',time,chunk.variation);
   const moving=Math.abs(response)>.075;
   const phase=Math.max(0,Math.min(3,Math.floor((response/Math.max(.01,this.wind.strength)*.5+.5)*4)));
   chunk.animatedImage.setFrame(moving?phase+1:0);
  }
 }
 get diagnostics(){return {tufts:this.count,animatedTufts:this.animatedCount,animatedPercent:Math.round(this.animatedCount/Math.max(1,this.count)*100),chunks:this.chunks.length,visibleChunks:this.visible.length,wind:{direction:this.wind.direction,strength:this.wind.strength}};}
}
