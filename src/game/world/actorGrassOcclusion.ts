import Phaser from 'phaser';
import type { Actor } from '../WorldScene';
import { drawGrass } from './grassArt';
import type { VisualPlant } from './vegetationOccupancy';
import { WaterHabitat } from './waterHabitat';
interface Patch {key:string;image:Phaser.GameObjects.Image;canvas:HTMLCanvasElement;lastX:number;lastY:number;cover:number;nextPaint:number;}
/** A tiny, recycled foreground patch per visible actor; physics and animation remain untouched. */
export class ActorGrassOcclusionLayer {
 private patches=new Map<string,Patch>();private growth=new Map<string,VisualPlant[]>();
 private frameFeet=new Map<string,number>();
 private covered=0;private heights:Record<string,number>={};
 constructor(private scene:Phaser.Scene,private habitat:WaterHabitat,plants:readonly VisualPlant[]){
  for(const p of plants.filter(p=>p.name==='GRASS_TALL'||p.name.startsWith('REEDS')||p.name==='CATTAILS')){const key=`${Math.floor(p.x/64)},${Math.floor(p.y/64)}`,list=this.growth.get(key)??[];list.push(p);this.growth.set(key,list);}
  scene.events.once('shutdown',()=>{for(const patch of this.patches.values()){patch.image.destroy();scene.textures.remove(patch.key);}this.patches.clear();});
 }
 private footFraction(sprite:Phaser.GameObjects.Sprite){
  const frame=sprite.frame,key=`${sprite.texture.key}:${frame.name}`;const cached=this.frameFeet.get(key);if(cached!==undefined)return cached;
  const c=document.createElement('canvas');c.width=frame.cutWidth;c.height=frame.cutHeight;const ctx=c.getContext('2d',{willReadFrequently:true})!;
  ctx.drawImage(sprite.texture.getSourceImage() as HTMLImageElement,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,0,0,frame.cutWidth,frame.cutHeight);
  const pixels=ctx.getImageData(0,0,c.width,c.height).data;let foot=1;
  outer:for(let y=c.height-1;y>=0;y--)for(let x=0;x<c.width;x++)if(pixels[(y*c.width+x)*4+3]>190){foot=(y+1)/c.height;break outer;}
  this.frameFeet.set(key,foot);return foot;
 }
 coverAt(x:number,y:number){
  if(!this.habitat.green(x,y))return 0;
  const gx=Math.floor(x/64),gy=Math.floor(y/64);
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)for(const p of this.growth.get(`${gx+dx},${gy+dy}`)??[]){
   if(Math.abs(x-p.x)<p.drawWidth*.4+8&&y>p.y-8&&y<p.y+12)return 16;
  }
  const i=this.habitat.index(x,y)*4,forest=this.habitat.masks.surfaces[i]===11;
  const growth=(Math.sin(x/137+y/219)+Math.cos(y/103-x/281)+2)/4;
  return forest||growth>.64?8:4;
 }
 update(actors:readonly Actor[]){
  this.covered=0;this.heights={};const view=this.scene.cameras.main.worldView;
  for(const actor of actors){
   let patch=this.patches.get(actor.id);
   const footY=actor.sprite.y+(this.footFraction(actor.sprite)-actor.sprite.originY)*actor.sprite.displayHeight;
   const cover=Math.min(this.coverAt(actor.x,actor.y),actor.sprite.displayHeight*.25);
   if(!cover||!actor.sprite.visible||!view.contains(actor.x,actor.y)){patch?.image.setVisible(false);continue;}
   if(!patch){const canvas=document.createElement('canvas');canvas.width=96;canvas.height=48;const key=`actor-front-grass-${actor.id}`;
    if(this.scene.textures.exists(key))this.scene.textures.remove(key);this.scene.textures.addCanvas(key,canvas);
    patch={key,canvas,image:this.scene.add.image(0,0,key).setOrigin(.5,1).setScale(1),lastX:Infinity,lastY:Infinity,cover:0,nextPaint:0};this.patches.set(actor.id,patch);
   }
   const x=Math.round(actor.x),y=Math.round(footY);
   if(this.scene.time.now>=patch.nextPaint&&(Math.abs(x-patch.lastX)>=3||Math.abs(y-patch.lastY)>=3||cover!==patch.cover)){
    patch.nextPaint=this.scene.time.now+80;
    const c=patch.canvas.getContext('2d',{willReadFrequently:true})!;c.clearRect(0,0,96,48);c.imageSmoothingEnabled=false;
    const span=Math.min(60,actor.sprite.displayWidth*.50),profile={width:cover>8?13:9,height:Math.ceil(cover),blades:cover>8?5:3};
    // World-anchored seeds prevent random popping and keep blade height consistent at each footfall.
    const cellX=Math.floor(actor.x/8),cellY=Math.floor(actor.y/8);
    for(let i=0;i<4;i++)drawGrass(c,48-span/2+span*i/3,47+(i%2),profile,(Math.imul(cellX+i*13,73856093)^Math.imul(cellY,19349663))>>>0,0,false,cover);
    const pixels=c.getImageData(0,0,96,48);
    for(let py=0;py<48;py++)for(let px=0;px<96;px++)if(!this.habitat.green(x+px-48,y+py-48))pixels.data[(py*96+px)*4+3]=0;
    c.putImageData(pixels,0,0);(patch.image.texture as Phaser.Textures.CanvasTexture).refresh();patch.lastX=x;patch.lastY=y;patch.cover=cover;
   }
   patch.image.setPosition(x,y).setDepth(actor.sprite.depth+.08).setVisible(true);this.covered++;this.heights[actor.id]=Math.round(cover);
  }
  const ids=new Set(actors.map(a=>a.id));for(const [id,p] of this.patches)if(!ids.has(id)){p.image.destroy();this.scene.textures.remove(p.key);this.patches.delete(id);}
 }
 get diagnostics(){return {patches:this.patches.size,visible:this.covered,coverWorldUnits:this.heights};}
}
