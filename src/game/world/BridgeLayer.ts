import Phaser from 'phaser';
import { inside } from '../navigation';
import { bridgePlans, bridgePoint, type BridgePlan } from './bridgePlan';
import { ObjectIntegrationLayer, type IntegrationAnchor } from './objectIntegration';
import type { WorldMasks } from './terrain';
interface PixelSource {pixels:Uint8ClampedArray;width:number;height:number;}
export class BridgeLayer {
 private objects:Phaser.GameObjects.Image[]=[];private integration:ObjectIntegrationLayer;private cullAt=0;private floorCount=0;private railCount=0;private postCount=0;
 private wood=new Map<string,PixelSource>();
 constructor(private scene:Phaser.Scene,masks:WorldMasks){
  const anchors:IntegrationAnchor[]=[];
  for(const p of bridgePlans){
   const sheet=scene.textures.get(`bridge-${p.style}`),frame=sheet.get('planks'),c=document.createElement('canvas');c.width=frame.cutWidth;c.height=frame.cutHeight;const ctx=c.getContext('2d')!;
   ctx.drawImage(sheet.getSourceImage() as HTMLImageElement,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,0,0,c.width,c.height);
   this.wood.set(p.crossing.id,{pixels:ctx.getImageData(0,0,c.width,c.height).data,width:c.width,height:c.height});
   this.floor(p);
   const count=Math.max(2,Math.ceil((p.length+24)/p.postSpacing)),start=-10,end=p.length+10;
   for(const side of [-1,1]){
    const across=side*(p.width/2+1);
    for(let i=0;i<=count;i++){
     const along=start+(end-start)*i/count,pos=bridgePoint(p,along,across),isEnd=i===0||i===count;
     if(i<count){const next=bridgePoint(p,start+(end-start)*(i+1)/count,across);this.rail(p,pos,next,i);}
     if(bridgePlans.some(other=>other!==p&&inside([pos.x,pos.y],other.crossing.shape)))continue;
     const key=`bridge-${p.style}`,f=sheet.get('post'),height=p.postHeight;
     const post=scene.add.image(Math.round(pos.x),Math.round(pos.y),key,'post').setOrigin(.5,.96).setScale(height/f.height).setDepth(pos.y+.12).setData('bridgePart','post');this.objects.push(post);this.postCount++;
     if(p.style==='large'&&(isEnd||i===Math.floor(count/2))){
      const base=sheet.get('stone');this.objects.push(scene.add.image(pos.x,pos.y+15,key,'stone').setOrigin(.5,1).setScale(32/base.height).setDepth(-10.2).setData('bridgePart','foundation'));
      if(isEnd){const lantern=sheet.get('decor');this.objects.push(scene.add.image(pos.x,pos.y-height+4,key,'decor').setOrigin(.5,1).setScale(13/lantern.height).setDepth(pos.y+.13).setData('bridgePart','lantern'));}
     }
     if(p.style==='farm'&&isEnd){const decor=sheet.get('decor');this.objects.push(scene.add.image(pos.x,pos.y-height*.30,key,'decor').setOrigin(.5,.5).setScale(12/decor.height).setDepth(pos.y+.14).setData('bridgePart','flower-planter'));}
     if(isEnd){anchors.push({id:`${p.crossing.id}-${side}-${i}`,x:pos.x,y:pos.y+2,depth:pos.y+.2,span:16,cover:7,kind:'plant'});
      const landing=sheet.get('landing'),bank=bridgePoint(p,along+(i===0?-3:3),across+side*5);
      const gx=Math.floor(bank.x/2),gy=Math.floor(bank.y/2),j=(gy*1536+gx)*4;
      if(gx>=0&&gy>=0&&gx<1536&&gy<1024&&masks.land[j+3]>127&&!masks.water[j+3]&&!masks.paths[j+3]&&[0,9,10,11].includes(masks.surfaces[j]))this.objects.push(scene.add.image(bank.x,bank.y,`bridge-${p.style}`,'landing').setOrigin(.5,.9).setScale(9/landing.height).setDepth(bank.y));
     }
    }
   }
  }
  this.integration=new ObjectIntegrationLayer(scene,masks,anchors,'bridge-root-integration',bridgePlans.map(p=>p.crossing.shape));
 }
 private pixel(p:BridgePlan,x:number,y:number,shade=0){
  const src=this.wood.get(p.crossing.id)!;
  // Sample the interior of ONE reference plank; joints are authored by the deck geometry.
  // This avoids repeating the entire panel's dark outer border as a checkerboard.
  const span=p.style==='large'?Math.max(4,Math.floor(src.width/7)-16):src.width-24;
  const sx=p.style==='large'?Math.floor(src.width/2)-6+((Math.floor(y*3)%12)+12)%12:12+((Math.floor(x*5)%span)+span)%span;
  const sy=p.style==='large'?40+((Math.floor(x*4)%Math.min(120,src.height-80))+Math.min(120,src.height-80))%Math.min(120,src.height-80):8+((Math.floor(y*3)%Math.max(4,Math.floor(src.height/5)-18))+Math.max(4,Math.floor(src.height/5)-18))%Math.max(4,Math.floor(src.height/5)-18);
  const i=(sy*src.width+sx)*4,base=src.pixels[i+3]<128?[166,105,45]:[src.pixels[i],src.pixels[i+1],src.pixels[i+2]];
  return base.map(v=>Math.max(0,Math.min(255,v+shade)));
 }
 private image(key:string,c:HTMLCanvasElement,x:number,y:number,depth:number,part:string){if(this.scene.textures.exists(key))this.scene.textures.remove(key);this.scene.textures.addCanvas(key,c);const image=this.scene.add.image(x,y,key).setOrigin(0).setScale(1).setDepth(depth).setData('bridgePart',part);this.objects.push(image);return image;}
 private floor(p:BridgePlan){
  const xs=p.crossing.shape.map(v=>v[0]),ys=p.crossing.shape.map(v=>v[1]),left=Math.floor(Math.min(...xs))-3,top=Math.floor(Math.min(...ys))-3,w=Math.ceil(Math.max(...xs))-left+4,h=Math.ceil(Math.max(...ys))-top+8;
  const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d')!,data=ctx.createImageData(w,h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const wx=left+x,wy=top+y,isFloor=inside([wx,wy],p.crossing.shape),shadow=inside([wx-2,wy-5],p.crossing.shape);if(!isFloor&&!shadow)continue;
   const j=(y*w+x)*4;if(!isFloor){data.data.set([32,43,37,72],j);continue;}
   const dx=wx-p.crossing.from[0],dy=wy-p.crossing.from[1],along=dx*p.ux+dy*p.uy,across=dx*p.nx+dy*p.ny;
   const seam=((along+12)%9+9)%9<1,edge=Math.abs(across)>p.width/2-2;
   const rgb=this.pixel(p,across+80,along+100,seam?-46:edge?-22:0);data.data.set([...rgb,255],j);
   if(Math.abs(Math.abs(across)-(p.width/2-4))<.7&&((along+11)%9+9)%9<1.7)data.data.set([71,61,44,255],j);
  }
  ctx.putImageData(data,0,0);this.image(`bridge-floor-${p.crossing.id}`,c,left,top,-10,'floor');this.floorCount++;
 }
 private rail(p:BridgePlan,a:{x:number;y:number},b:{x:number;y:number},index:number){
  const lifts=p.style==='rustic'?[p.postHeight*.64]:[p.postHeight*.68,p.postHeight*.28];
  const left=Math.floor(Math.min(a.x,b.x))-3,top=Math.floor(Math.min(a.y,b.y)-p.postHeight)-3,w=Math.ceil(Math.max(a.x,b.x))-left+4,h=Math.ceil(Math.max(a.y,b.y))-top+4;
  const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d')!;ctx.imageSmoothingEnabled=false;
  const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy),steps=Math.ceil(length);
  for(const lift of lifts)for(let i=0;i<=steps;i++){
   const t=i/steps;if(bridgePlans.some(other=>other!==p&&inside([a.x+dx*t,a.y+dy*t],other.crossing.shape)))continue;const sag=p.style==='rustic'?Math.sin(t*Math.PI)*2:0,x=Math.round(a.x+dx*t-left),y=Math.round(a.y+dy*t-top-lift+sag);
   if(p.style==='rustic'){ctx.fillStyle='#6f4d26';ctx.fillRect(x,y,2,3);ctx.fillStyle='#e4c78e';ctx.fillRect(x,y,2,1);}
   else {const rgb=this.pixel(p,i+index*17,26,-12);ctx.fillStyle=`rgb(${rgb.map(v=>Math.max(0,Math.min(255,v))).join(',')})`;ctx.fillRect(x,y,2,4);ctx.fillStyle='#e5b563';ctx.fillRect(x,y,2,1);ctx.fillStyle='#724522';ctx.fillRect(x,y+4,2,1);}
  }
  this.image(`bridge-rail-${p.crossing.id}-${a.x.toFixed(0)}-${a.y.toFixed(0)}`,c,left,top,(a.y+b.y)/2+.05,'rail');this.railCount++;
 }
 update(time:number){const view=this.scene.cameras.main.worldView;if(time>=this.cullAt){this.cullAt=time+160;for(const o of this.objects)o.setVisible(Phaser.Geom.Rectangle.Overlaps(view,o.getBounds()));}this.integration.update(time,view);}
 get diagnostics(){return {styles:Object.fromEntries(['rustic','farm','large'].map(style=>[style,bridgePlans.filter(p=>p.style===style).length])),floors:this.floorCount,rails:this.railCount,posts:this.postCount,objects:this.objects.length,visible:this.objects.filter(i=>i.visible).length,integration:this.integration.diagnostics,rotatedSprites:0};}
}
