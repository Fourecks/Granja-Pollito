import Phaser from 'phaser';
import type { NavigationGrid, Point } from '../navigation';
import { MAP } from './mapConfig';
import type { WorldMasks } from './terrain';
import { CrabColony } from './crabs';

function texture(scene:Phaser.Scene,variant:number,frame:number){
 const key=`beach-crab-${variant}-${frame}`;if(scene.textures.exists(key))return key;
 const c=document.createElement('canvas');c.width=32;c.height=24;const g=c.getContext('2d')!;
 const [dark,base,light]=[['#783f2e','#c56c43','#efaa64'],['#784437','#ba5b48','#e58d6d'],['#825c35','#c4924b','#eac078']][variant];
 const r=(color:string,x:number,y:number,w:number,h:number)=>{g.fillStyle=color;g.fillRect(x,y,w,h);},step=frame%2;
 for(const side of [-1,1])for(let leg=0;leg<3;leg++){
  const x=side<0?7:23,shift=(leg+frame)%2;
  r(dark,x,12+leg*2,3,1);r(base,x+side*2,12+leg*2+shift,3,1);r(dark,x+side*3,13+leg*2+shift,2,2);
 }
 r(dark,9,10,14,8);r(base,8,11,16,5);r(light,11,9,10,3);r(base,10,10,12,6);r('#e6ad70',12,11,6,1);r(dark,11,17,10,1);
 for(const side of [-1,1]){const x=side<0?6:23,y=5+step;
  r(dark,x+1,y+3,2,5);r(base,x,y,4,5);r(light,x,y,4,1);r(base,x-1,y-2,2,4);r(light,x+2,y-2,2,3);
 }
 r(dark,12,6,2,4);r(dark,19,6,2,4);r('#272c24',12,6,2,2);r('#272c24',19,6,2,2);r('#ffe9bd',12,6,1,1);r('#ffe9bd',19,6,1,1);
 scene.textures.addCanvas(key,c);return key;
}
export class CrabLayer {
 readonly colony:CrabColony;private images:Phaser.GameObjects.Image[]=[];private shadows:Phaser.GameObjects.Ellipse[]=[];private dust:Phaser.GameObjects.Graphics;private next=0;
 constructor(private scene:Phaser.Scene,masks:WorldMasks,nav:NavigationGrid){
  const sand=(x:number,y:number)=>{
   if(x<8||x>=MAP.width-8||y<1520||y>=MAP.height-8)return false;
   const i=(Math.floor(y/2)*(MAP.width/2)+Math.floor(x/2))*4;
   return masks.surfaces[i]===6&&masks.land[i+3]>127&&masks.water[i+3]<128&&masks.cliffs[i+3]<128&&masks.paths[i+3]<128&&nav.canWalk(x,y);
  };
  const candidates:Point[]=[];
  // One burrow per coastline band: spread the colony over the lower beach.
  for(let x=70;x<MAP.width-50;x+=130){
   const found:Point[]=[];for(let y=1540;y<2010;y+=9)if(sand(x,y)&&sand(x-6,y)&&sand(x+6,y)&&sand(x,y-5)&&sand(x,y+5))found.push([x,y]);
   if(found.length)candidates.push(found[Math.floor(found.length*.58)]);
  }
  this.colony=new CrabColony(sand,candidates);this.dust=scene.add.graphics().setDepth(2999);
  for(const c of this.colony.crabs){
   const [x,y]=c.home,g=scene.add.graphics().setDepth(-15.8);
   g.fillStyle(0xb59a60,.6).fillEllipse(x,y+1,12,5).fillStyle(0x6f5c3d,.85).fillEllipse(x,y,8,3).fillStyle(0xeed7a0,.8).fillRect(x-5,y+2,8,1);
   for(let f=0;f<4;f++)texture(scene,c.variant,f);
   this.shadows.push(scene.add.ellipse(x,y,c.size*.6,3,0x665235,.18));
   this.images.push(scene.add.image(x,y,`beach-crab-${c.variant}-0`).setOrigin(.5,19/24).setScale(c.size/32));
  }
 }
 update(time:number,delta:number){
  this.colony.update(time,delta);const view=this.scene.cameras.main.worldView,redraw=time>=this.next;
  if(redraw){this.next=time+90;this.dust.clear();}
  this.colony.crabs.forEach((c,i)=>{
   const image=this.images[i],shadow=this.shadows[i],visible=c.state!=='hidden'&&view.contains(c.x,c.y);
   image.setVisible(visible);shadow.setVisible(visible);if(!visible)return;
   const progress=c.state==='emerge'?Math.min(1,(time-c.since)/650):c.state==='dig'?Math.max(0,1-(time-c.since)/650):1;
   const frame=Math.floor(time/(c.state==='walk'||c.state==='return'?115:300)+i)%4;
   image.setTexture(`beach-crab-${c.variant}-${frame}`).setCrop(0,0,32,Math.max(1,Math.round(24*progress))).setPosition(Math.round(c.x),Math.round(c.y+(1-progress)*c.size*.45)).setDepth(c.y);
   shadow.setPosition(c.x,c.y).setAlpha(.18*progress).setDepth(c.y-.1);
   if(redraw&&(c.state==='dig'||c.state==='emerge'))for(let n=0;n<4;n++){
    const p=(time/240+n*.23)%1,x=c.x+(n%2?1:-1)*(3+p*6),y=c.y-Math.sin(p*Math.PI)*4;
    this.dust.fillStyle(n%2?0xc5a36d:0xf1d79a,(1-p)*.8).fillRect(Math.round(x),Math.round(y),2,1);
   }
  });
 }
 get diagnostics(){return {count:this.colony.crabs.length,crabs:this.colony.crabs.map(c=>({id:c.id,x:Math.round(c.x),y:Math.round(c.y),home:c.home,state:c.state}))};}
}
