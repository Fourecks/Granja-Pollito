import Phaser from 'phaser';
import { MAP } from './mapConfig';
import { WindSystem, type WindVariation } from './wind';
import { ObjectIntegrationLayer } from './objectIntegration';
import { pathPixelColor, type WorldMasks } from './terrain';
import { visualRoadMask } from './roadAppearance';
import { selectReadableTulips } from './tulipDisplay';
import type { TulipFieldPlan, Tulip } from './tulipFieldPlan';
interface Patch {image:Phaser.GameObjects.Image;moving:boolean;variation:WindVariation;nextFrame:number;}
const names=['PINK_TULIP_01','PINK_TULIP_02','PINK_TULIP_03','PINK_TULIP_04','PINK_TULIP_BUD','PINK_TULIP_CLUSTER_SMALL','PINK_TULIP_CLUSTER_MEDIUM','PINK_TULIP_CLUSTER_LARGE'];
export class TulipFieldLayer {
 private objects:Phaser.GameObjects.Image[]=[];
 private flowerCount=0;private integration:ObjectIntegrationLayer;
 private patches:Patch[]=[];private visible:Patch[]=[];private cullAt=0;
 constructor(private scene:Phaser.Scene,readonly plan:TulipFieldPlan,private wind:WindSystem,masks:WorldMasks){
  this.ground(masks);this.flowers();this.props();
  const anchors=this.plan.props.filter(p=>p.key!=='BENCH').flatMap(p=>(p.key==='ARCH'?[-34,34]:p.key==='FENCE'?[-21,21]:[0]).map((dx,i)=>({id:`${p.id}-${i}`,x:p.position[0]+dx,y:p.position[1]+p.height*.04,depth:p.position[1],span:p.key==='TREE_BLOSSOM_PINK'?28:13,cover:6})));
  this.integration=new ObjectIntegrationLayer(scene,masks,anchors,'tulip-prop-integration');
 }
 private ground(masks:WorldMasks){
  const c=document.createElement('canvas');c.width=MAP.width/2;c.height=MAP.height/2;const ctx=c.getContext('2d')!;
  ctx.lineJoin=ctx.lineCap='round';ctx.strokeStyle='#937742';ctx.lineWidth=11;ctx.beginPath();this.plan.path.forEach(([x,y],i)=>i?ctx.lineTo(x/2,y/2):ctx.moveTo(x/2,y/2));ctx.stroke();
  ctx.strokeStyle='#d0ac72';ctx.lineWidth=9;ctx.stroke();
  const road=ctx.getImageData(0,0,c.width,c.height),base=visualRoadMask(masks.surfaces,masks),W=c.width;
  for(let y=0;y<c.height;y++)for(let x=0;x<W;x++){
   const i=(y*W+x)*4;if(!road.data[i+3])continue;
   if(base[i+3]||masks.water[i+3]||masks.cliffs[i+3]||masks.land[i+3]<128){road.data[i+3]=0;continue;}
   const edge=[-1,1,-W,W].some(o=>road.data[i+o*4+3]<128&&!base[i+o*4+3]);
   const color=pathPixelColor(x,y,edge);road.data.set([...color,255],i);
  }
  ctx.putImageData(road,0,0);
  const [rx,ry]=this.plan.rest;ctx.fillStyle='#cabb94';ctx.beginPath();ctx.ellipse(rx/2,ry/2,26,17,0,0,Math.PI*2);ctx.fill();
  // Tiny uneven paving marks stay within the intimate rest area.
  ctx.fillStyle='#a49571';for(let y=-14;y<=14;y+=4)for(let x=-23;x<=23;x+=7)if(x*x/625+y*y/225<.9)ctx.fillRect(rx/2+x+(y%3),ry/2+y,4,1);
  const bench=this.plan.props.find(p=>p.key==='BENCH')!;
  for(const [dx,dy,w] of [[-25,-3,5],[-12,-8,4],[22,1,5],[29,-6,4]]){
   const x=Math.round((bench.position[0]+dx)/2),y=Math.round((bench.position[1]+dy)/2);ctx.fillStyle='rgba(42,43,27,.23)';ctx.fillRect(x-1,y,w,1);ctx.fillStyle='rgba(42,43,27,.10)';ctx.fillRect(x-2,y+1,w+2,1);
  }
  for(let cy=0;cy<c.height;cy+=128)for(let cx=0;cx<c.width;cx+=128){
   const chunk=document.createElement('canvas');chunk.width=chunk.height=128;const cc=chunk.getContext('2d')!;cc.drawImage(c,cx,cy,128,128,0,0,128,128);
   if(!cc.getImageData(0,0,128,128).data.some((v,i)=>i%4===3&&v))continue;
   const key=`tulip-path-${cx}-${cy}`;if(this.scene.textures.exists(key))this.scene.textures.remove(key);this.scene.textures.addCanvas(key,chunk);
   this.objects.push(this.scene.add.image(cx*2,cy*2,key).setOrigin(0).setScale(2).setDepth(-12));
  }
 }
 private flowers(){
  const atlas=this.scene.textures.get('tulip-flowers'),source=atlas.getSourceImage() as HTMLImageElement;
  const readable=selectReadableTulips(this.plan.flowers);this.flowerCount=readable.length;
  const byPatch=new Map<string,Tulip[]>();for(const f of readable){const key=`${Math.floor(f.x/96)},${Math.floor(f.y/32)}`,list=byPatch.get(key)??[];list.push(f);byPatch.set(key,list);}
  const movingIds=new Set([...byPatch].filter(([,f])=>f[0].animated).sort(([a],[b])=>Math.sin(Number(a.split(',')[0])*17+Number(a.split(',')[1])*31)-Math.sin(Number(b.split(',')[0])*17+Number(b.split(',')[1])*31)).slice(0,Math.floor(byPatch.size*.14)).map(([id])=>id));
  for(const [id,flowers] of byPatch){
   const [px,py]=id.split(',').map(Number),x=px*96,y=py*32,moving=movingIds.has(id);
   const w=88,h=56,padding=20,frames=moving?5:1,c=document.createElement('canvas');c.width=w*frames;c.height=h;const ctx=c.getContext('2d')!;ctx.imageSmoothingEnabled=false;
   const sorted=flowers.slice().sort((a,b)=>a.y-b.y);
   for(let frame=0;frame<frames;frame++){ctx.save();ctx.translate(frame*w,0);
    for(const f of sorted){const sprite=atlas.get(names[f.variant]),height=f.height/2,width=height*sprite.width/sprite.height,baseX=(f.x-x)/2+padding,baseY=(f.y-y)/2+padding;
     ctx.save();const lean=frame===0?0:([-.045,-.022,.022,.045][frame-1])*(.75+f.phase);
     // Stem-root pivot: the root remains fixed, only upper rows bend. No lateral translation.
     ctx.transform(1,0,lean,1,-lean*baseY,0);
     ctx.drawImage(source,sprite.cutX,sprite.cutY,sprite.cutWidth,sprite.cutHeight,baseX-width/2,baseY-height,width,height);ctx.restore();
    }ctx.restore();
   }
   const key=`tulip-patch-${id}`;if(this.scene.textures.exists(key))this.scene.textures.remove(key);const texture=this.scene.textures.addCanvas(key,c)!;
   for(let frame=0;frame<frames;frame++)texture.add(frame,0,frame*w,0,w,h);
   const image=this.scene.add.image(x-padding*2,y-padding*2,key,0).setOrigin(0).setScale(2).setDepth(y+16);
   const patch:Patch={image,moving,variation:this.wind.variation(x,y),nextFrame:0};this.patches.push(patch);this.objects.push(image);
  }
 }
 private props(){
  for(const prop of this.plan.props){const [x,y]=prop.position;
   if(prop.key==='ARCH'){
    const texture=this.scene.textures.get('tulip-garden'),f=texture.get('ARCH'),split=Math.round(f.height*.43),scale=prop.height/f.height;
    if(!texture.has('ARCH_CROWN')){texture.add('ARCH_CROWN',0,f.cutX,f.cutY,f.cutWidth,split);texture.add('ARCH_POSTS',0,f.cutX,f.cutY+split,f.cutWidth,f.cutHeight-split);}
    const top=y-prop.height*.96;
    this.objects.push(this.scene.add.image(x,top,'tulip-garden','ARCH_CROWN').setOrigin(.5,0).setScale(scale).setDepth(y+36));
    this.objects.push(this.scene.add.image(x,top+split*scale,'tulip-garden','ARCH_POSTS').setOrigin(.5,0).setScale(scale).setDepth(y));
    continue;
   }
   const key=prop.key==='TREE_BLOSSOM_PINK'?'vegetation':'tulip-garden',f=this.scene.textures.get(key).get(prop.key);
   let frameKey=key,frameName=prop.key as string,scale=prop.height/f.height;
   if(prop.key==='BENCH'){
    const c=document.createElement('canvas');c.height=Math.round(prop.height);c.width=Math.round(c.height*f.width/f.height);const ctx=c.getContext('2d')!;ctx.imageSmoothingEnabled=false;
    ctx.drawImage(this.scene.textures.get(key).getSourceImage() as HTMLImageElement,f.cutX,f.cutY,f.cutWidth,f.cutHeight,0,0,c.width,c.height);frameKey='garden-bench-native';this.scene.textures.addCanvas(frameKey,c);frameName='__BASE';scale=1;
   }
   const image=this.scene.add.image(x,y,frameKey,frameName).setOrigin(.5,.96).setScale(scale).setDepth(y).setData('naturalObject',{id:prop.id,kind:prop.key,interaction:prop.key==='BENCH'?'sit-prepared':undefined});
   if(prop.key==='BENCH'){image.setInteractive({useHandCursor:true});image.on('pointerup',()=>this.scene.events.emit('natural-object-selected',{id:prop.id,kind:'bench',position:prop.position}));}
   this.objects.push(image);
  }
 }
 update(time:number){
  this.integration.update(time,this.scene.cameras.main.worldView);
  if(time>=this.cullAt){this.cullAt=time+160;const view=this.scene.cameras.main.worldView;this.visible=[];
   for(const o of this.objects)o.setVisible(Phaser.Geom.Rectangle.Overlaps(view,o.getBounds()));for(const p of this.patches)if(p.image.visible&&p.moving)this.visible.push(p);
  }
  for(const p of this.visible){if(time<p.nextFrame)continue;p.nextFrame=time+160/p.variation.speed;const response=this.wind.response('tulips',time,p.variation);
   p.image.setFrame(Math.abs(response)<.025?0:1+Math.max(0,Math.min(3,Math.floor((response/Math.max(.03,this.wind.strength)*.5+.5)*4))));
  }
 }
 get diagnostics(){const moving=this.patches.filter(p=>p.moving).length;return {integration:this.integration.diagnostics,id:this.plan.zone.id,clusters:this.plan.flowers.length,visibleFlowerModels:this.flowerCount,patches:this.patches.length,animatedPatches:moving,animatedPercent:Math.round(moving/this.patches.length*100),visibleAnimated:this.visible.length,props:this.plan.props.length,obstacles:this.plan.obstacles.length,bench:'pinkTulipBench',archWalkable:true};}
}
