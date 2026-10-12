import Phaser from 'phaser';
import { MAP, waterfalls, bridges } from './mapConfig';
import { inside } from '../navigation';
import type { WorldMasks } from './terrain';
export class WaterLayer {
 private ripples:Phaser.GameObjects.Graphics;private lastFrame=-1;
 private falls:Phaser.GameObjects.Sprite[]=[];private ticks=0;
 constructor(private scene:Phaser.Scene,private masks:WorldMasks){
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
 update(time:number){
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
 get animationFrame(){return this.ticks;}
}
