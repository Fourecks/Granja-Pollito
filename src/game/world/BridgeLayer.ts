import Phaser from 'phaser';
import { inside } from '../navigation';
import { bridgePlans, bridgePoint, bridgeAtlas, type BridgePlan } from './bridgePlan';
import { ObjectIntegrationLayer, type IntegrationAnchor } from './objectIntegration';
import type { WorldMasks } from './terrain';
interface PixelSource {pixels:Uint8ClampedArray;width:number;height:number;}
export class BridgeLayer {
 private objects:Phaser.GameObjects.Image[]=[];private integration:ObjectIntegrationLayer;private cullAt=0;private floorCount=0;private railCount=0;private postCount=0;
 private wood=new Map<string,PixelSource>();
 constructor(private scene:Phaser.Scene,masks:WorldMasks){
  const anchors:IntegrationAnchor[]=[];
  for(const p of bridgePlans){
   const sheet=scene.textures.get(bridgeAtlas(p)),frame=sheet.get('planks'),c=document.createElement('canvas');c.width=frame.cutWidth;c.height=frame.cutHeight;const ctx=c.getContext('2d')!;
   ctx.drawImage(sheet.getSourceImage() as HTMLImageElement,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,0,0,c.width,c.height);
   this.wood.set(p.crossing.id,{pixels:ctx.getImageData(0,0,c.width,c.height).data,width:c.width,height:c.height});
   this.floor(p);
   const count=p.style==='rope'&&p.length>200?2:1,start=-8,end=p.length+8;
   if(p.style==='footwalk')continue;
   for(const side of [-1,1]){
    const across=side*(p.width/2+1);
    for(let i=0;i<=count;i++){
     const along=start+(end-start)*i/count,pos=bridgePoint(p,along,across),isEnd=i===0||i===count;
     if(i<count){const next=bridgePoint(p,start+(end-start)*(i+1)/count,across);const steps=Math.ceil(Math.hypot(next.x-pos.x,next.y-pos.y)/16);for(let k=0;k<steps;k++)this.rail(p,{x:pos.x+(next.x-pos.x)*k/steps,y:pos.y+(next.y-pos.y)*k/steps},{x:pos.x+(next.x-pos.x)*(k+1)/steps,y:pos.y+(next.y-pos.y)*(k+1)/steps});}
     if(bridgePlans.some(other=>other!==p&&inside([pos.x,pos.y],other.crossing.shape)))continue;
     const key='bridge-stone',f=scene.textures.get(key).get('post'),height=p.postHeight;
     const post=scene.add.image(Math.round(pos.x),Math.round(pos.y),key,'post').setOrigin(.5,.96).setScale(height/f.height).setDepth(pos.y+.12).setData('bridgePart','post');this.objects.push(post);this.postCount++;
     if(isEnd){anchors.push({id:`${p.crossing.id}-${side}-${i}`,x:pos.x,y:pos.y+2,depth:pos.y+.2,span:16,cover:7,kind:'plant'});
      const landing=sheet.get('landing'),bank=bridgePoint(p,along+(i===0?-3:3),across+side*5);
      const gx=Math.floor(bank.x/2),gy=Math.floor(bank.y/2),j=(gy*1536+gx)*4;
      if(gx>=0&&gy>=0&&gx<1536&&gy<1024&&masks.land[j+3]>127&&!masks.water[j+3]&&!masks.paths[j+3]&&[0,9,10,11].includes(masks.surfaces[j]))this.objects.push(scene.add.image(bank.x,bank.y,bridgeAtlas(p),'landing').setOrigin(.5,.9).setScale(9/landing.height).setDepth(bank.y));
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
  const stone=p.style==='stone'||p.style==='arched';
  const span=Math.max(4,src.width-32),rows=Math.max(4,stone?src.height-32:Math.floor(src.height/5)-18);
  const sx=stone?50+((Math.floor(x*5)%Math.max(4,src.width-100))+Math.max(4,src.width-100))%Math.max(4,src.width-100):16+((Math.floor(x*5)%span)+span)%span;
  const sy=stone?50+((Math.floor(y*5)%Math.max(4,src.height-100))+Math.max(4,src.height-100))%Math.max(4,src.height-100):8+((Math.floor(y*3)%rows)+rows)%rows;
  const i=(sy*src.width+sx)*4,base=src.pixels[i+3]<128?(stone?[151,144,127]:[166,105,45]):[src.pixels[i],src.pixels[i+1],src.pixels[i+2]];
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
   const stone=p.style==='stone'||p.style==='arched',seam=!stone&&((along+12)%9+9)%9<1,edge=Math.abs(across)>p.width/2-2;
   const rgb=this.pixel(p,across+80,along+100,seam?-46:edge?-22:0);data.data.set([...rgb,255],j);
   if(!stone&&Math.floor((along+12)/9)%4===0&&Math.abs(Math.abs(across)-(p.width/2-4))<.7&&((along+11)%9+9)%9<1.7)data.data.set([71,61,44,255],j);
  }
  ctx.putImageData(data,0,0);this.image(`bridge-floor-${p.crossing.id}`,c,left,top,-10,'floor');this.floorCount++;
 }
 private rail(p:BridgePlan,a:{x:number;y:number},b:{x:number;y:number}){
  const stone=p.style==='stone'||p.style==='arched',lifts=[stone?2:p.postHeight*.64];
  const left=Math.floor(Math.min(a.x,b.x))-3,top=Math.floor(Math.min(a.y,b.y)-p.postHeight)-3,w=Math.ceil(Math.max(a.x,b.x))-left+4,h=Math.ceil(Math.max(a.y,b.y))-top+4;
  const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d')!;ctx.imageSmoothingEnabled=false;
  const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy),steps=Math.ceil(length);
  for(const lift of lifts)for(let i=0;i<=steps;i++){
   const t=i/steps;if(bridgePlans.some(other=>other!==p&&inside([a.x+dx*t,a.y+dy*t],other.crossing.shape)))continue;const sag=p.style==='rope'?Math.sin(t*Math.PI)*2:0,x=Math.round(a.x+dx*t-left),y=Math.round(a.y+dy*t-top-lift+sag);
   if(p.style==='rope'||p.style==='rustic'){ctx.fillStyle='#6f4d26';ctx.fillRect(x,y,2,3);ctx.fillStyle='#e4c78e';ctx.fillRect(x,y,2,1);}
   else {const rgb=this.pixel(p,i,18,-14);ctx.fillStyle=`rgb(${rgb.join(',')})`;const arch=p.style==='arched'?Math.round(Math.sin(t*Math.PI)*4):0;ctx.fillRect(x,y-arch,2,4+arch);ctx.fillStyle='#b2ad91';ctx.fillRect(x,y-arch,2,1);if(i%19<4){ctx.fillStyle='#697845';ctx.fillRect(x,y-arch,2,1);}}

  }
  this.image(`bridge-rail-${p.crossing.id}-${a.x.toFixed(0)}-${a.y.toFixed(0)}`,c,left,top,(a.y+b.y)/2+.05,'rail');this.railCount++;
 }
 update(time:number){const view=this.scene.cameras.main.worldView;if(time>=this.cullAt){this.cullAt=time+160;for(const o of this.objects)o.setVisible(Phaser.Geom.Rectangle.Overlaps(view,o.getBounds()));}this.integration.update(time,view);}
 get diagnostics(){return {styles:Object.fromEntries(['rustic','rope','stone','arched','footwalk'].map(style=>[style,bridgePlans.filter(p=>p.style===style).length])),floors:this.floorCount,rails:this.railCount,posts:this.postCount,objects:this.objects.length,visible:this.objects.filter(i=>i.visible).length,integration:this.integration.diagnostics,rotatedSprites:0};}
}
