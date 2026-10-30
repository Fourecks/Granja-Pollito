import Phaser from 'phaser';
import { RuralGateLayer } from './RuralGateLayer';
import type { GateActor } from './ruralGates';
import { ruralBuildings,paddocks,fenceSegments } from './ruralBuildings';
import type { Point } from '../navigation';
export class RuralBuildingsLayer {
 private gates:RuralGateLayer;
 constructor(scene:Phaser.Scene,onSelect:(id:string)=>void,canInteract:()=>boolean){
  this.gates=new RuralGateLayer(scene);
  for(const p of ruralBuildings){
   const [x,y]=p.anchor,image=scene.add.image(x,y,p.texture).setOrigin(.5,1).setDepth(p.door[1]);
   image.setScale(p.displayWidth/image.width).setData('buildingId',p.id);
   const hit=image.setInteractive({useHandCursor:true}).setData('interiorReady',Boolean(p.interiorId));
   hit.on('pointerup',()=>{if(canInteract()&&p.interiorId)onSelect(p.interiorId);});
  }
  // Native-resolution pixel timber. Rails and collision share the same endpoints.
  const rail=(a:Point,b:Point,index:number)=>{
   const left=Math.min(a[0],b[0])-8,top=Math.min(a[1],b[1])-30,w=Math.abs(b[0]-a[0])+16,h=Math.abs(b[1]-a[1])+36;
   const c=document.createElement('canvas');c.width=Math.ceil(w/2);c.height=Math.ceil(h/2);const ctx=c.getContext('2d')!;ctx.imageSmoothingEnabled=false;
   const ax=Math.round((a[0]-left)/2),ay=Math.round((a[1]-top)/2),bx=Math.round((b[0]-left)/2),by=Math.round((b[1]-top)/2),length=Math.hypot(bx-ax,by-ay);
   for(let i=0;i<=length;i++){const t=i/(length||1),x=Math.round(ax+(bx-ax)*t),y=Math.round(ay+(by-ay)*t);
    ctx.fillStyle='#4f4929';ctx.globalAlpha=.28;ctx.fillRect(x,y,3,2);ctx.globalAlpha=1;
    for(const dy of [6,11]){ctx.fillStyle='#65482c';ctx.fillRect(x,y-dy,2,2);ctx.fillStyle=i%7===0?'#b38b4d':'#a37941';ctx.fillRect(x,y-dy,2,1);}
   }
   const posts=Math.max(1,Math.ceil(length/16));for(let i=0;i<=posts;i++){const t=i/posts,x=Math.round(ax+(bx-ax)*t),y=Math.round(ay+(by-ay)*t);ctx.fillStyle='#563c27';ctx.fillRect(x-1,y-14,3,15);ctx.fillStyle='#b38a4d';ctx.fillRect(x-1,y-14,2,13);ctx.fillStyle='#d1ac68';ctx.fillRect(x-1,y-14,2,1);ctx.fillStyle='#75843c';ctx.fillRect(x-2,y,2,1);}
   const key=`rural-fence-${index}`;if(scene.textures.exists(key))scene.textures.remove(key);scene.textures.addCanvas(key,c);scene.add.image(left,top,key).setOrigin(0).setScale(2).setDepth(Math.max(a[1],b[1]));
  };
  fenceSegments.forEach(([a,b],i)=>rail(a,b,i));
  for(const p of paddocks){for(const [px,py,water] of [[p.x+22,p.y+21,false],[p.x+p.w-23,p.y+30,true]] as const){
   const g=scene.add.graphics().setDepth(py);g.fillStyle(0x5a412b).fillRect(px-13,py-6,26,12).fillStyle(0xa37d45).fillRect(px-13,py-7,26,2).fillStyle(water?0x447f94:0xc4a352).fillRect(px-10,py-4,20,6).fillStyle(water?0x82b4b8:0xe0be71).fillRect(px-8,py-3,12,2);
  }}
  // Agricultural rows occupy the whole original field with a central aisle.
  for(let row=0;row<8;row++)for(let col=0;col<13;col++){
   if(col===6)continue;const x=1998+col*30,y=856+row*26,g=scene.add.graphics().setDepth(y);
   g.fillStyle(0x62472a,.45).fillRect(x-10,y-2,22,4);
   const variant=Math.floor(col/3)%4;
   g.fillStyle(0x355a29).fillRect(x-7,y-7,14,7).fillStyle(0x527b2c).fillRect(x-9,y-9,7,5).fillRect(x+2,y-11,8,5).fillStyle(0x85a344).fillRect(x-5,y-12,5,5).fillRect(x+1,y-7,6,4);
   if(variant===0)g.fillStyle(0xa8542d).fillRect(x-5,y-7,10,6).fillStyle(0xda8833).fillRect(x-3,y-7,6,5);
   if(variant===1)g.fillStyle(0x91b357).fillRect(x-5,y-8,9,6).fillStyle(0xb1c86f).fillRect(x-3,y-8,5,3);
   if(variant===2)g.fillStyle(0xb84937).fillRect(x-5,y-6,4,4).fillRect(x+2,y-9,4,4);
   if(variant===3)g.fillStyle(0x63813d).fillRect(x,y-20,3,16).fillStyle(0xd8b65e).fillRect(x-1,y-22,4,9);
  }
  for(const [x,y,name] of [[255,1250,'ROCK_MOSS'],[295,1280,'ROCK_SMALL'],[2780,1376,'HOLLOW_LOG'],[2835,1383,'FLOWERS_WHITE']] as const)scene.add.image(x,y,'vegetation',name).setOrigin(.5,1).setDisplaySize(name==='HOLLOW_LOG'?35:26,22).setDepth(y);
  for(const [x,y] of [[2780,1365],[2820,1396]]){const g=scene.add.graphics().setDepth(y);g.fillStyle(0x78603b).fillRect(x-10,y-3,20,5).fillStyle(0x302c20).fillRect(x-6,y-3,12,4);}
 }
 update(time:number,delta:number,actors:readonly GateActor[]){this.gates.update(time,delta,actors);}
 get gateDiagnostics(){return this.gates.diagnostics;}
 get diagnostics(){return ruralBuildings.map(p=>({id:p.id,door:p.door,footprint:p.footprint}));}
}
