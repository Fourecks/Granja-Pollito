import Phaser from 'phaser';
import { MAP, bridges, ramps } from './mapConfig';
import { zones } from './zones';
import type { WorldMasks } from './terrain';
import type { VegetationPlan } from './vegetationPlan';
import { WindSystem, type WindVariation } from './wind';
interface Tuft {x:number;y:number;variant:number;size:number;profile:number;mirror:boolean;alpha:number;animated:boolean;offset:number;}
interface GrassChunk {staticImage:Phaser.GameObjects.Image;animatedImage?:Phaser.GameObjects.Image;variation:WindVariation;nextFrame:number;}
const PIXEL=MAP.pixel,CHUNK=MAP.chunk/PIXEL;
// Twelve reusable silhouettes: fine, medium, open, tall, flat, narrow and irregular.
const profiles=[[.48,1.05],[.72,.83],[1,.72],[.64,1.16],[.95,.50],[.45,.82],[.78,.66],[.85,.94],[.36,.65],[.57,.58],[.7,1.08],[1,.4]];
const hash=(x:number,y:number)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
const cluster=(x:number,y:number,scale:number)=>{const gx=x/scale,gy=y/scale,ix=Math.floor(gx),iy=Math.floor(gy),fx=gx-ix,fy=gy-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return (hash(ix,iy)*(1-u)+hash(ix+1,iy)*u)*(1-v)+(hash(ix,iy+1)*(1-u)+hash(ix+1,iy+1)*u)*v;};
export class MicroGrassLayer {
 private chunks:GrassChunk[]=[];
 private visible:GrassChunk[]=[];
 private nextCull=0;
 private textureBytes=0;private fineBlades=0;private texturedGreenCells=0;private greenCells=0;
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
  const occupied=new Set<string>();for(const p of plan.plants.filter(p=>p.solid))occupied.add(`${Math.floor(p.x/24)},${Math.floor(p.y/24)}`);
  const rest=[...zones.flatMap(z=>[z.approach,...(z.legacyObject?[z.center]:[])]),...plan.plants.filter(p=>p.name==='SWING_TREE').map(p=>[p.x,p.y] as const)];
  const crossings=[...bridges,...ramps];
  for(let i=0;i<125000;i++){
   const x=Math.floor(random()*width),y=Math.floor(random()*height),wx=x*PIXEL,wy=y*PIXEL;
   const material=masks.surfaces[(y*width+x)*4],forest=material===11,farm=material===9;
   const patch=cluster(x,y,forest?42:63)*.7+cluster(x+119,y-47,19)*.3;
   if(random()>.22+patch*.65)continue;
   if(y>760&&random()>.9)continue;
   if(farm&&random()>.96)continue;
   const size=2+Math.floor(random()*3);
   let clear=true;for(let dy=-size*2;dy<=1&&clear;dy++)for(let dx=-size;dx<=size;dx++)if(!green(x+dx,y+dy)){clear=false;break;}
   if(!clear)continue;
   if(occupied.has(`${Math.floor(wx/24)},${Math.floor(wy/24)}`))continue;
   if(rest.some(([px,py])=>Math.hypot(wx-px,wy-py)<42))continue;
   if(crossings.some(c=>Math.hypot(wx-c.from[0],wy-c.from[1])<65||Math.hypot(wx-c.to[0],wy-c.to[1])<42))continue;
   // Keep looser edges around paths and the plaza even inside green masks.
   const edge=2+Math.floor(random()*3);
   if(!green(x-edge,y)||!green(x+edge,y)||!green(x,y-edge)||!green(x,y+edge))continue;
   tufts.push({x,y,variant:Math.floor(random()*4),size,profile:Math.floor(random()*profiles.length),mirror:random()<.5,alpha:.56+random()*.32,animated:random()<.12,offset:Math.floor(random()*4)});
  }
  this.count=tufts.length;this.animatedCount=tufts.filter(t=>t.animated).length;
  const atlas=scene.textures.get('micro-grass'),source=atlas.getSourceImage() as HTMLImageElement;
  const draw=(ctx:CanvasRenderingContext2D,t:Tuft,frame:number,cx:number,cy:number)=>{
   const f=atlas.get(`grass_${['idle','sway_1','sway_2','sway_3'][frame]}_${t.variant}`);
   const [pw,ph]=profiles[t.profile],w=Math.max(2,Math.round(t.size*2*pw)),h=Math.max(3,Math.round(t.size*2*ph));
   ctx.save();ctx.globalAlpha=t.alpha;ctx.translate(t.x-cx,t.y-cy);if(t.mirror)ctx.scale(-1,1);
   ctx.drawImage(source,f.cutX,f.cutY,f.cutWidth,f.cutHeight,-Math.floor(w/2),-h,w,h);ctx.restore();
  };
  for(let cy=0;cy<height;cy+=CHUNK)for(let cx=0;cx<width;cx+=CHUNK){
   const local=tufts.filter(t=>t.x>=cx&&t.x<cx+CHUNK&&t.y>=cy&&t.y<cy+CHUNK);if(!local.length&&!Array.from({length:CHUNK},(_,dy)=>dy).some(dy=>Array.from({length:CHUNK},(_,dx)=>dx).some(dx=>green(cx+dx,cy+dy))))continue;
   // Padding lets tufts straddle chunk boundaries without clipping their tips.
   const padding=12,side=CHUNK+padding*2;
   const staticCanvas=document.createElement('canvas');staticCanvas.width=staticCanvas.height=side;
   const ctx=staticCanvas.getContext('2d')!;ctx.imageSmoothingEnabled=false;
   // Fine understory fills the gaps between tufts, with no extra textures or GameObjects.
   for(let y=0;y<CHUNK;y++)for(let x=0;x<CHUNK;x++){const gx=cx+x,gy=cy+y;if(!green(gx,gy))continue;
    if(x%8===0&&y%8===0){this.greenCells++;}
    const growth=cluster(gx,gy,53);
    if(hash(gx+311,gy-79)>.10+growth*.18)continue;
    const h=1+(hash(gx-11,gy+91)>.64?1:0),w=1+(hash(gx+33,gy)>.72?1:0);if(!green(gx,gy-h)||(w===2&&(!green(gx+1,gy)||!green(gx+1,gy-h))))continue;
    const blade=atlas.get(`grass_idle_${Math.floor(hash(gx+29,gy)*4)}`);
    ctx.globalAlpha=.22+hash(gx,gy+171)*.19;
    ctx.drawImage(source,blade.cutX,blade.cutY,blade.cutWidth,blade.cutHeight,x+padding, y+padding-h,w,h);this.fineBlades++;
   }ctx.globalAlpha=1;
   for(const t of local.filter(t=>!t.animated))draw(ctx,t,0,cx-padding,cy-padding);
   // Coverage tracks small green cells containing any fine texture, not opaque alpha coverage.
   for(let y=0;y<CHUNK;y+=8)for(let x=0;x<CHUNK;x+=8){if(!green(cx+x,cy+y))continue;const pixels=ctx.getImageData(x+padding,y+padding,8,8).data;if(pixels.some((v,i)=>i%4===3&&v>0))this.texturedGreenCells++;}
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
   this.textureBytes+=side*side*4*(moving.length?6:1);
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
 get diagnostics(){return {estimatedTextureMiB:Math.round(this.textureBytes/1048576*10)/10,fineBlades:this.fineBlades,texturedGreenCellPercent:Math.round(this.texturedGreenCells/Math.max(1,this.greenCells)*100),visualProfiles:profiles.length,tufts:this.count,animatedTufts:this.animatedCount,animatedPercent:Math.round(this.animatedCount/Math.max(1,this.count)*100),chunks:this.chunks.length,visibleChunks:this.visible.length,wind:{direction:this.wind.direction,strength:this.wind.strength}};}
}
