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
  for(const [index,fall] of waterfalls.entries()){
   const kind=index===0||index===3?'medium':'small',key=`waterfall-${kind}`,sheet=scene.textures.get(key),f=sheet.get('0'),frames=6;
   const scale=fall.height*2/f.height;
   // Uniform scale preserves the generated waterfall's rocks, core and splash proportions.
   const anim=`river-craft-${kind}-flow`;if(!scene.anims.exists(anim))scene.anims.create({key:anim,frames:Array.from({length:frames},(_,frame)=>({key,frame:String(frame)})),frameRate:7,repeat:-1});
   this.falls.push(scene.add.sprite(...fall.position,key,'0').setOrigin(.5,0).setScale(scale).setDepth(-7.8).play({key:anim,startFrame:index%frames}));
  }
 }
 private createDepthLayers(){
  const w=MAP.width/MAP.pixel,h=MAP.height/MAP.pixel,side=MAP.chunk/MAP.pixel;
  const atlas=this.scene.textures.get('water-depth-art'),source=atlas.getSourceImage() as HTMLImageElement;
  const tiles=new Map<string,{pixels:Uint8ClampedArray;width:number;height:number}>();
  for(const name of ['deep','medium','bed','bank']){const f=atlas.get(name),c=document.createElement('canvas');c.width=f.cutWidth;c.height=f.cutHeight;const ctx=c.getContext('2d')!;ctx.drawImage(source,f.cutX,f.cutY,f.cutWidth,f.cutHeight,0,0,c.width,c.height);tiles.set(name,{pixels:ctx.getImageData(0,0,c.width,c.height).data,width:c.width,height:c.height});}
  const sample=(name:string,x:number,y:number)=>{const t=tiles.get(name)!,i=((Math.floor(y*3)%t.height)*t.width+Math.floor(x*3)%t.width)*4;return [t.pixels[i],t.pixels[i+1],t.pixels[i+2]];};
  const noise=(x:number,y:number)=>{let n=Math.imul(x+197,374761393)^Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return (n^(n>>>16))>>>0;};
  for(let cy=0;cy<h;cy+=side)for(let cx=0;cx<w;cx+=side){
   const bed=document.createElement('canvas'),surface=document.createElement('canvas');bed.width=bed.height=surface.width=surface.height=side;
   const bc=bed.getContext('2d')!,sc=surface.getContext('2d')!,floor=bc.createImageData(side,side),water=sc.createImageData(side,side);let filled=false;
   for(let y=0;y<side;y++)for(let x=0;x<side;x++){
    const gx=cx+x,gy=cy+y,i=gy*w+gx,j=(y*side+x)*4;if(gx>=w||gy>=h||this.masks.water[i*4+3]<128)continue;filled=true;
    const depth=this.habitat.distance[i]/3,t=Math.min(1,depth/20),n=noise(gx,gy),near=Math.max(0,1-depth/5);
    const bedColor=sample('bed',gx,gy),bankColor=sample('bank',gx,gy),mid=sample('medium',gx,gy),deep=sample('deep',gx,gy);
    for(let k=0;k<3;k++){
     floor.data[j+k]=Math.round(bedColor[k]*(1-near*.55)+bankColor[k]*near*.55);
     // Reference tile colors, with restrained reflection contrast and depth-dependent alpha.
     const textured=mid[k]*(1-t)+deep[k]*t,quiet=[17,110,144][k];
     water.data[j+k]=Math.round(textured*.60+quiet*.40+n%3-1);
    }
    floor.data[j+3]=255;water.data[j+3]=Math.round(255*(.40+.58*t));
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
  // Tiny mask-clipped spray and broken foam rings, batched with existing surface highlights.
  for(const [index,fall] of waterfalls.entries()){
   const bx=fall.position[0],by=fall.position[1]+fall.height*2-5;
   if(!view.contains(bx,by))continue;
   const radius=fall.width+2+(frame+index)%5;
   for(let i=0;i<20;i++){const a=i*Math.PI/10,px=Math.round((bx+Math.cos(a)*radius)/2)*2,py=Math.round((by+Math.sin(a)*radius*.25)/2)*2;
    if(inWater(px,py)){g.fillStyle(0xb8f4ed,.16);g.fillRect(px,py,i%3?2:4,2);}
   }
   for(let i=0;i<7;i++){const phase=(frame+i*3+index)%11,px=Math.round((bx+Math.sin(i*2.37+index)*fall.width*.65)/2)*2,py=by-8-Math.sin(phase/11*Math.PI)*8;
    if(inWater(px,py)){g.fillStyle(i%2?0xe5ffff:0x89e1ef,.45);g.fillRect(px,Math.round(py/2)*2,2,2);}
   }
  }
  for(const f of this.falls){const visible=Phaser.Geom.Rectangle.Overlaps(view,f.getBounds());f.setVisible(visible);if(visible)f.anims.resume();else f.anims.pause();}
 }
 get diagnostics(){return {mode:'reference-layered-pixel-art',shader:false,waterfalls:this.falls.length,fallFrames:this.falls.map(f=>String(f.frame.name)),mediumFrames:6,smallFrames:6,depthLayers:this.layers.length,visibleLayers:this.layers.filter(i=>i.visible).length,estimatedTextureMiB:Math.round(this.textureBytes/1048576*10)/10};}
 get animationFrame(){return this.ticks;}
}
