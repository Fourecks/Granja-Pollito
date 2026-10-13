import Phaser from 'phaser';
import { MAP, waterfalls, bridges } from './mapConfig';
import { inside } from '../navigation';
import type { WorldMasks } from './terrain';
import { WaterHabitat } from './waterHabitat';
export class WaterLayer {
 private ripples:Phaser.GameObjects.Graphics;private lastFrame=-1;
 readonly habitat:WaterHabitat;
 private layers:Phaser.GameObjects.Image[]=[];private cullAt=0;private textureBytes=0;
 private falls:Phaser.GameObjects.Sprite[]=[];private ticks=0;
 constructor(private scene:Phaser.Scene,private masks:WorldMasks){
  this.habitat=new WaterHabitat(masks);this.createDepthLayers();
  this.ripples=scene.add.graphics().setDepth(-12);
  for(const fall of waterfalls){
   const w=fall.width,h=fall.height,key=`phase1-${fall.id}`,c=document.createElement('canvas');c.width=w*8;c.height=h;
   const ctx=c.getContext('2d')!;
   for(let f=0;f<8;f++){
    const left=f*w;ctx.fillStyle='#247da4';ctx.fillRect(left+3,0,w-6,h-5);
    for(let x=4;x<w-4;x+=3){ctx.fillStyle=x%2?'#64cedd':'#b3eeee';ctx.fillRect(left+x,0,2,h-6);ctx.fillStyle='#f0fff1';for(let y=-20;y<h-6;y+=24)ctx.fillRect(left+x,y+(f*3+x)%24,1,10+(x%5));}
    ctx.fillStyle='#d5f8ea';for(let x=0;x<w;x+=3)ctx.fillRect(left+x,h-9+(x+f)%5,3,4);ctx.fillStyle='#80d6de';ctx.fillRect(left+1,h-3,w-2,2);
   }
   if(scene.textures.exists(key))scene.textures.remove(key);const t=scene.textures.addCanvas(key,c)!;
   for(let f=0;f<8;f++)t.add(f,0,f*w,0,w,h);
   const anim=`${key}-flow`;if(!scene.anims.exists(anim))scene.anims.create({key:anim,frames:Array.from({length:8},(_,frame)=>({key,frame})),frameRate:9,repeat:-1});
   this.falls.push(scene.add.sprite(...fall.position,key,0).setOrigin(.5,0).setScale(2).setDepth(-11).play(anim));
  }
 }
 private createDepthLayers(){
  const w=MAP.width/MAP.pixel,h=MAP.height/MAP.pixel,side=MAP.chunk/MAP.pixel;
  const noise=(x:number,y:number)=>{let n=Math.imul(x+197,374761393)^Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return (n^(n>>>16))>>>0;};
  for(let cy=0;cy<h;cy+=side)for(let cx=0;cx<w;cx+=side){
   const bed=document.createElement('canvas'),surface=document.createElement('canvas');bed.width=bed.height=surface.width=surface.height=side;
   const bc=bed.getContext('2d')!,sc=surface.getContext('2d')!,floor=bc.createImageData(side,side),water=sc.createImageData(side,side);let filled=false;
   for(let y=0;y<side;y++)for(let x=0;x<side;x++){
    const gx=cx+x,gy=cy+y,i=gy*w+gx,j=(y*side+x)*4;if(gx>=w||gy>=h||this.masks.water[i*4+3]<128)continue;filled=true;
    const depth=this.habitat.distance[i]/3,t=Math.min(1,depth/26),n=noise(gx,gy),patch=noise(gx>>3,gy>>3)%19-9;
    const gravel=n%113===0,weed=noise(gx>>1,gy>>1)%127===0;
    const base=weed?[79,108,68]:gravel?[128,132,111]:[163+patch,157+patch,110+patch];
    for(let k=0;k<3;k++)floor.data[j+k]=base[k]+n%5-2;floor.data[j+3]=255;
    // Real alpha blending over the riverbed: readable gravel near shore, hidden at depth.
    const shallow=[69,166,169],deep=[19,103,145];for(let k=0;k<3;k++)water.data[j+k]=Math.round(shallow[k]*(1-t)+deep[k]*t);
    water.data[j+3]=Math.round(255*(.32+.64*t));
   }
   if(!filled)continue;bc.putImageData(floor,0,0);sc.putImageData(water,0,0);
   for(const [name,c,depth] of [['riverbed',bed,-29],['water-depth',surface,-28]] as const){
    const key=`${name}-${cx}-${cy}`;if(this.scene.textures.exists(key))this.scene.textures.remove(key);this.scene.textures.addCanvas(key,c);
    this.layers.push(this.scene.add.image(cx*MAP.pixel,cy*MAP.pixel,key).setOrigin(0).setScale(MAP.pixel).setDepth(depth));this.textureBytes+=side*side*4;
   }
  }
 }
 update(time:number){
  if(time>=this.cullAt){this.cullAt=time+180;const view=this.scene.cameras.main.worldView;for(const image of this.layers)image.setVisible(Phaser.Geom.Rectangle.Overlaps(view,image.getBounds()));}
  const frame=Math.floor(time/140);if(frame===this.lastFrame)return;this.lastFrame=frame;this.ticks++;
  const view=this.scene.cameras.main.worldView,w=MAP.width/2,mask=this.masks.water,g=this.ripples;g.clear();
  const inWater=(x:number,y:number)=>{const i=(Math.floor(y/2)*w+Math.floor(x/2))*4;return x>=0&&y>=0&&x<MAP.width&&y<MAP.height&&mask[i+3]>127;};
  for(let y=Math.max(0,Math.floor(view.top/40)*40);y<Math.min(MAP.height,view.bottom+40);y+=40)for(let x=Math.max(0,Math.floor(view.left/44)*44);x<Math.min(MAP.width,view.right+44);x+=44){
   const index=Math.floor(x/44)+Math.floor(y/40)*17,px=x+index%19+(frame+index)%8*2,py=y+index%13;
   if(!inWater(px,py)||!inWater(px+18,py)||bridges.some(b=>inside([px,py],b.shape)))continue;
   g.fillStyle(index%3===0?0xabe6df:0x58c0d3,.28+(frame+index)%3*.06);g.fillRect(px,py,8+index%5*2,2);if(index%4===0)g.fillRect(px+4,py+4,6,2);
  }
  for(const f of this.falls){const visible=Phaser.Geom.Rectangle.Overlaps(view,f.getBounds());f.setVisible(visible);if(visible)f.anims.resume();else f.anims.pause();}
 }
 get diagnostics(){return {mode:'layered-pixel-art',shader:false,depthLayers:this.layers.length,visibleLayers:this.layers.filter(i=>i.visible).length,estimatedTextureMiB:Math.round(this.textureBytes/1048576*10)/10};}
 get animationFrame(){return this.ticks;}
}
