import Phaser from 'phaser';
import { MAP, rawWater } from './mapConfig';
import type { Polygon } from '../navigation';
import type { WorldMasks } from './terrain';

interface Region {shape:Polygon;bounds:[number,number,number,number];count:number;}
interface Fish {image:Phaser.GameObjects.Image;region:Polygon;x:number;y:number;tx:number;ty:number;speed:number;species:number;alpha:number;scale:number;phase:number;frameAt:number;frame:number;jumpAt:number;jumpFor:number;retargetAt:number;}
interface Splash {x:number;y:number;start:number;duration:number;}
const fishPalette=[
 {base:'#e69a38',light:'#ffd36e',dark:'#9c5429',fin:'#f4bd52',stripe:'#fff0b0'},
 {base:'#438eb0',light:'#a1e0dc',dark:'#275d87',fin:'#54b9c4',stripe:'#e7f4d1'},
 {base:'#c8b64a',light:'#f5e889',dark:'#5f6741',fin:'#b4a04b',stripe:'#314f49'},
 {base:'#d76753',light:'#ffb58c',dark:'#8f414b',fin:'#d68c72',stripe:'#fff0b0'},
 {base:'#888f91',light:'#d8e6db',dark:'#465d66',fin:'#73a3a5',stripe:'#faf1c9'},
 {base:'#846ac0',light:'#d2b8f2',dark:'#4d4381',fin:'#a48fdf',stripe:'#f7e8ba'},
];

/** Small procedural pixel fish keep the water lively without adding heavy atlases. */
export class FishLayer {
 private fish:Fish[]=[];private splashes:Splash[]=[];private effects:Phaser.GameObjects.Graphics;private nextJump=0;private lastEffects=0;private seed=0x51f15e;private created=0;
 constructor(private scene:Phaser.Scene,private masks:WorldMasks){
  this.effects=scene.add.graphics().setDepth(-11.6);
  for(let species=0;species<fishPalette.length;species++)for(let frame=0;frame<4;frame++)this.makeTexture(species,frame);
  const regions=this.regions();
  for(const region of regions)for(let i=0;i<region.count;i++){
   const point=this.sample(region.shape,region.bounds);if(!point)continue;
   const species=this.randomInt(fishPalette.length),scale=.76+this.random()*.64,alpha=.36+this.random()*.34;
   const image=scene.add.image(point.x,point.y,`pond-fish-${species}-0`).setOrigin(.5).setScale(scale).setAlpha(alpha).setDepth(-13.5);
   const fish:Fish={image,region:region.shape,x:point.x,y:point.y,tx:point.x,ty:point.y,speed:12+this.random()*18,species,alpha,scale,phase:this.random()*Math.PI*2,frameAt:0,frame:0,jumpAt:0,jumpFor:0,retargetAt:0};
   this.target(fish);this.fish.push(fish);
  }
  this.created=this.fish.length;
 }
 private random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 private randomInt(n:number){return Math.floor(this.random()*n);}
 private regions():Region[]{
  return rawWater.map((shape,index)=>{const xs=shape.map(p=>p[0]),ys=shape.map(p=>p[1]);return {shape,bounds:[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)],count:index===0?18:index===1?12:index<6?3:2};});
 }
 private wet(x:number,y:number){const gx=Math.floor(x/MAP.pixel),gy=Math.floor(y/MAP.pixel);if(gx<0||gy<0||gx>=MAP.width/MAP.pixel||gy>=MAP.height/MAP.pixel)return false;const i=(gy*(MAP.width/MAP.pixel)+gx)*4;return this.masks.water[i+3]>127&&this.masks.cliffs[i+3]<128;}
 private sample(shape:Polygon,bounds:[number,number,number,number],cx?:number,cy?:number,radius=180){
  for(let tries=0;tries<120;tries++){
   const x=bounds[0]+this.random()*(bounds[2]-bounds[0]),y=bounds[1]+this.random()*(bounds[3]-bounds[1]);
   if(cx!==undefined&&Math.hypot(x-cx,y-(cy??y))>radius)continue;
   if(!this.wet(x,y)||!this.wet(x+4,y)||!this.wet(x-4,y)||!this.wet(x,y+4)||!this.wet(x,y-4))continue;
   let inside=false;for(let i=0,j=shape.length-1;i<shape.length;j=i++){const [xi,yi]=shape[i],[xj,yj]=shape[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;}
   if(inside)return {x,y};
  }
  return null;
 }
 private target(fish:Fish,time=0){
  const xs=fish.region.map(p=>p[0]),ys=fish.region.map(p=>p[1]),bounds:[number,number,number,number]=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
  for(let attempt=0;attempt<12;attempt++){
   const point=this.sample(fish.region,bounds,fish.x,fish.y,120+this.random()*110);if(!point)continue;
   let clear=true;for(let n=1;n<=8;n++){const t=n/8;if(!this.wet(fish.x+(point.x-fish.x)*t,fish.y+(point.y-fish.y)*t)){clear=false;break;}}
   if(clear){fish.tx=point.x;fish.ty=point.y;fish.retargetAt=0;return;}
  }
  fish.tx=fish.x;fish.ty=fish.y;fish.retargetAt=time+700+this.random()*900;
 }
 private makeTexture(species:number,frame:number){
  const key=`pond-fish-${species}-${frame}`;if(this.scene.textures.exists(key))this.scene.textures.remove(key);
  const c=document.createElement('canvas');c.width=28;c.height=18;const ctx=c.getContext('2d')!;ctx.imageSmoothingEnabled=false;const p=fishPalette[species],wag=frame%2?1:0;
  const rect=(color:string,x:number,y:number,w:number,h:number)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
  rect(p.dark,3-wag,7,4,4);rect(p.fin,2-wag,5,2,3);rect(p.fin,2-wag,10,2,3);rect(p.base,7,5,13,8);rect(p.light,10,4,8,2);rect(p.dark,9,12,8,2);rect(p.base,20,6,4,6);rect(p.light,21,6,3,2);
  if(species===0){rect(p.stripe,10,7,2,5);rect(p.stripe,15,6,2,6);rect(p.fin,13,3,5,2);rect(p.dark,14,13,5,2);}
  if(species===1){rect(p.dark,8,6,2,6);rect(p.stripe,12,6,2,6);rect(p.dark,16,6,2,6);rect(p.fin,13,3,4,2);}
  if(species===2){rect(p.dark,10,5,2,8);rect(p.dark,15,5,2,8);rect(p.fin,12,3,5,2);rect(p.light,20,7,3,2);}
  if(species===3){rect(p.fin,11,3,8,2);rect(p.fin,11,13,8,2);rect(p.stripe,8,6,2,6);rect(p.light,18,5,3,2);}
  if(species===4){rect(p.stripe,11,5,2,8);rect(p.stripe,16,5,2,8);rect(p.fin,13,3,5,2);rect(p.dark,8,6,2,6);}
  if(species===5){rect(p.stripe,10,6,2,6);rect(p.stripe,15,5,2,7);rect(p.fin,12,3,6,2);rect(p.fin,13,13,5,2);}
  rect('#233b42',21,7,1,1);rect('#fff3c9',22,6,1,1);rect(p.light,7,7,1,1);
  this.scene.textures.addCanvas(key,c);
 }
 update(time:number,delta:number,view:Phaser.Geom.Rectangle){
  const dt=Math.min(delta,50)/1000;
  let jumper:Fish|undefined;
  for(const fish of this.fish){
   const jumping=fish.jumpFor>0&&time-fish.jumpAt<fish.jumpFor,progress=jumping?(time-fish.jumpAt)/fish.jumpFor:0;
   const dx=fish.tx-fish.x,dy=fish.ty-fish.y,distance=Math.hypot(dx,dy);
   if(!jumping&&distance>2){const step=Math.min(distance,fish.speed*dt);const nx=fish.x+dx/distance*step,ny=fish.y+dy/distance*step;if(this.wet(nx,ny)){fish.x=nx;fish.y=ny;}else this.target(fish,time);}
   else if(!jumping&&time>=fish.retargetAt)this.target(fish,time);
   if(fish.jumpFor>0&&!jumping){fish.jumpFor=0;fish.image.setAlpha(fish.alpha).setScale(fish.scale);this.splashes.push({x:fish.x,y:fish.y,start:time,duration:620});}
   const swimFrame=Math.floor(time/170+fish.phase)%4;if(swimFrame!==fish.frame&&time-fish.frameAt>110){fish.frame=swimFrame;fish.frameAt=time;fish.image.setTexture(`pond-fish-${fish.species}-${swimFrame}`);}
   const lift=jumping?Math.sin(Math.PI*progress)*26:0,bob=jumping?0:Math.sin(time*.003+fish.phase)*1.3;
   fish.image.setPosition(fish.x,fish.y-lift+bob).setRotation(Math.atan2(dy,dx));
   fish.image.setAlpha(jumping ? .98 : fish.alpha).setScale(fish.scale*(jumping?1+Math.sin(Math.PI*progress)*.15:1));
   fish.image.setVisible(view.x<fish.x+80&&view.right>fish.x-80&&view.y<fish.y+80&&view.bottom>fish.y-80);
   if(jumping)jumper=fish;
  }
  if(!this.nextJump)this.nextJump=time+5200+this.random()*4000;
  if(this.fish.length&&time>this.nextJump&&!jumper){const fish=this.fish[this.randomInt(this.fish.length)];fish.jumpAt=time;fish.jumpFor=680;this.splashes.push({x:fish.x,y:fish.y,start:time,duration:620});this.nextJump=time+5200+this.random()*9000;}
  if(time-this.lastEffects>50){this.drawSplashes(time);this.lastEffects=time;}
 }
 private drawSplashes(time:number){
  this.effects.clear();this.splashes=this.splashes.filter(s=>time-s.start<s.duration);
  for(const s of this.splashes){const t=(time-s.start)/s.duration;for(let ring=0;ring<2;ring++){const r=4+t*18+ring*7;this.effects.lineStyle(1.6,ring?0x8fe6f1:0xe8fbf4,(1-t)*.72);this.effects.strokeEllipse(s.x-r,s.y-r*.36,r*2,r*.72);}}
 }
 get diagnostics(){return {created:this.created,visible:this.fish.filter(f=>f.image.visible).length,species:fishPalette.length,swimming:true,surfaceJump:!!this.fish.some(f=>f.jumpFor>0)};}
}
