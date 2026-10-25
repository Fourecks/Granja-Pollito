import Phaser from 'phaser';
import { inside } from '../navigation';
import { bridgePlans, bridgePoint, bridgeAtlas, type BridgePlan } from './bridgePlan';
import { ObjectIntegrationLayer, type IntegrationAnchor } from './objectIntegration';
import type { WorldMasks } from './terrain';
import { cliffFaces } from './mapConfig';
import { bridgeGeometry, bridgeSocket, type BridgeGeometry } from './bridgeGeometry';
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
   const geometry=bridgeGeometry(p,masks);this.floor(p,geometry);this.bankContact(p,geometry,masks);
   if(p.style==='footwalk')continue;
   for(const side of [-1,1]){
    const first=bridgeSocket(p,geometry,0,side),last=bridgeSocket(p,geometry,1,side);
    const steps=Math.ceil(Math.hypot(last.foot.x-first.foot.x,last.foot.y-first.foot.y)/16);
    for(let k=0;k<steps;k++)this.rail(p,geometry,side,k/steps,(k+1)/steps);
    for(const socket of [first,last]){
     const pos=socket.foot;
     if(p.style==='rustic'||p.style==='rope')this.post(p,socket);
     anchors.push({id:`${p.crossing.id}-${side}-${pos.x}`,x:pos.x,y:pos.y+2,depth:pos.y+.2,span:12,cover:4,kind:'plant'});
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
 private floor(p:BridgePlan,geometry:BridgeGeometry){
  // Build the canvas from the rendered geometry, not only the historical crossing polygon: stone thresholds may extend onto dry road.
  const ends=[bridgePoint(p,geometry.start,-p.width/2),bridgePoint(p,geometry.start,p.width/2),bridgePoint(p,geometry.end,-p.width/2),bridgePoint(p,geometry.end,p.width/2)];
  const xs=ends.map(v=>v.x),ys=ends.map(v=>v.y),left=Math.floor(Math.min(...xs))-4,top=Math.floor(Math.min(...ys))-4,w=Math.ceil(Math.max(...xs))-left+6,h=Math.ceil(Math.max(...ys))-top+10;
  const stone=p.style==='stone'||p.style==='arched';
  const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d')!,data=ctx.createImageData(w,h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const wx=left+x,wy=top+y;if(cliffFaces.some(face=>inside([wx,wy],face)))continue;
   const vx=wx-p.crossing.from[0],vy=wy-p.crossing.from[1],a=vx*p.ux+vy*p.uy;
   const across0=(wx-p.crossing.from[0])*p.nx+(wy-p.crossing.from[1])*p.ny;
   const inDeck=a>=geometry.start&&a<=geometry.end&&Math.abs(across0)<=p.width/2;
   const isFloor=inDeck&&(stone||inside([wx,wy],p.crossing.shape)),shadow=a>=geometry.start&&a<=geometry.end&&Math.abs(across0)<=p.width/2&&(!stone?inside([wx-2,wy-5],p.crossing.shape):true);if(!isFloor&&!shadow)continue;
   const j=(y*w+x)*4;if(!isFloor){data.data.set([32,43,37,72],j);continue;}
   const dx=wx-p.crossing.from[0],dy=wy-p.crossing.from[1],along=dx*p.ux+dy*p.uy,across=dx*p.nx+dy*p.ny;
   const seam=!stone&&((along+12)%9+9)%9<1,edge=Math.abs(across)>p.width/2-2;
   let rgb=this.pixel(p,across+80,along+100,seam?-46:edge?-22:0);
   if(stone){
    // Larger blocks on larger crossings, with a darker perimeter and restrained mortar: coherent scale at every bridge width.
    const block=Math.max(7,Math.min(11,Math.round(p.width*.34))),row=Math.floor((along-geometry.start)/block),offset=(row&1)*block*.5;
    const crossCell=((across+p.width/2+offset)%block+block)%block,alongCell=((along-geometry.start)%block+block)%block;
    const mortar=crossCell<1.15||alongCell<1.15;
    const threshold=Math.min(along-geometry.start,geometry.end-along)<2;
    if(mortar)rgb=rgb.map(v=>Math.max(0,v-26));
    if(threshold||edge)rgb=rgb.map(v=>Math.max(0,v-16));
   }
   data.data.set([...rgb,255],j);
   if(!stone&&Math.floor((along+12)/9)%4===0&&Math.abs(Math.abs(across)-(p.width/2-4))<.7&&((along+11)%9+9)%9<1.7)data.data.set([71,61,44,255],j);
  }
  ctx.putImageData(data,0,0);this.image(`bridge-floor-${p.crossing.id}`,c,left,top,-10,'floor');this.floorCount++;
 }
 private bankContact(p:BridgePlan,g:BridgeGeometry,masks:WorldMasks){
  if(p.crossing.kind==='pier')return;
  const stone=p.style==='stone'||p.style==='arched';
  for(const [end,sign] of [[g.start,-1],[g.end,1]]){
   const q=bridgePoint(p,end,0),left=Math.floor(q.x-p.width),top=Math.floor(q.y-p.width),size=Math.ceil(p.width*2),c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d')!;
   for(let y=0;y<size;y+=2)for(let x=0;x<size;x+=2){const wx=left+x,wy=top+y,i=(Math.floor(wy/2)*1536+Math.floor(wx/2))*4,dx=wx-p.crossing.from[0],dy=wy-p.crossing.from[1],along=(dx*p.ux+dy*p.uy-end)*sign,across=Math.abs(dx*p.nx+dy*p.ny);
    const contact=stone?7:4;
    if(masks.water[i+3]||masks.cliffs[i+3]||masks.land[i+3]<128||along<0||along>contact||across>p.width/2)continue;
    // Soft earth/masonry contact instead of a hard rectangular bridge edge on top of the path.
    const fade=1-along/contact;ctx.fillStyle=stone?`rgba(92,79,58,${(.15*fade).toFixed(3)})`:along<2?'rgba(43,45,32,.23)':'rgba(98,79,48,.10)';ctx.fillRect(x,y,2,2);
   }
   this.image(`bridge-bank-${p.crossing.id}-${sign}`,c,left,top,-10.1,'bank');
  }
 }
 private post(p:BridgePlan,socket:ReturnType<typeof bridgeSocket>){
  const x=Math.round(socket.foot.x),y=Math.round(socket.foot.y),height=p.postHeight;
  const sheet=this.scene.textures.get('bridge-stone'),f=sheet.get('post'),src=document.createElement('canvas');src.width=f.cutWidth;src.height=f.cutHeight;const sc=src.getContext('2d')!;sc.drawImage(sheet.getSourceImage() as HTMLCanvasElement,f.cutX,f.cutY,f.cutWidth,f.cutHeight,0,0,src.width,src.height);
  const data=sc.getImageData(0,0,src.width,src.height).data;let left=src.width,right=0,top=src.height,bottom=0;
  for(let sy=0;sy<src.height;sy++)for(let sx=0;sx<src.width;sx++)if(data[(sy*src.width+sx)*4+3]>64){left=Math.min(left,sx);right=Math.max(right,sx);top=Math.min(top,sy);bottom=Math.max(bottom,sy);}
  const width=Math.round((right-left+1)*height/(bottom-top+1)),c=document.createElement('canvas');c.width=width+4;c.height=height+5;const ctx=c.getContext('2d')!;ctx.imageSmoothingEnabled=false;
  ctx.fillStyle='rgba(33,40,30,.22)';ctx.fillRect(2,height,width,2);ctx.drawImage(src,left,top,right-left+1,bottom-top+1,2,0,width,height);
  const knotY=socket.rope.y-(y-height);ctx.fillStyle='#d8bc80';ctx.fillRect(Math.floor(c.width/2)-3,knotY,7,1);
  const image=this.image(`bridge-post-${p.crossing.id}-${x}-${y}`,c,x-Math.floor(c.width/2),y-height,y+.12,'post');
  image.setData('crossingId',p.crossing.id).setData('material','wood').setData('socket',socket.rope);this.postCount++;
 }
 private rail(p:BridgePlan,g:BridgeGeometry,side:number,t0:number,t1:number){
  const start=bridgeSocket(p,g,0,side),end=bridgeSocket(p,g,1,side),stone=p.style==='stone'||p.style==='arched';
  const point=(t:number)=>({x:Math.round(start.foot.x+(end.foot.x-start.foot.x)*t),y:Math.round(start.foot.y+(end.foot.y-start.foot.y)*t-(stone?2:g.lift)+(stone?0:Math.sin(t*Math.PI)*2))});
  const a=point(t0),b=point(t1),left=Math.min(a.x,b.x)-3,top=Math.min(a.y,b.y)-3,w=Math.abs(b.x-a.x)+7,h=Math.abs(b.y-a.y)+12;
  const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d')!,steps=Math.max(1,Math.ceil((t1-t0)*(g.end-g.start)*2));
  for(let i=0;i<=steps;i++){
   const t=t0+(t1-t0)*i/steps,q=point(t),x=q.x-left,y=q.y-top;
   if(stone){const rgb=this.pixel(p,t*(g.end-g.start),18,-14);ctx.fillStyle=`rgb(${rgb.join(',')})`;const arch=p.style==='arched'?Math.round(Math.sin(t*Math.PI)*4):0;ctx.fillRect(x,y-arch,2,4+arch);ctx.fillStyle='#b2ad91';ctx.fillRect(x,y-arch,2,1);}
   else {ctx.fillStyle='#6f4d26';ctx.fillRect(x,y,2,2);ctx.fillStyle='#e4c78e';ctx.fillRect(x,y,2,1);}
  }
  const footY=start.foot.y+(end.foot.y-start.foot.y)*(t0+t1)/2;
  this.image(`bridge-rail-${p.crossing.id}-${side}-${t0}`,c,left,top,footY+.05,'rail');this.railCount++;
 }

 update(time:number){const view=this.scene.cameras.main.worldView;if(time>=this.cullAt){this.cullAt=time+160;for(const o of this.objects)o.setVisible(Phaser.Geom.Rectangle.Overlaps(view,o.getBounds()));}this.integration.update(time,view);}
 get diagnostics(){return {styles:Object.fromEntries(['rustic','rope','stone','arched','footwalk'].map(style=>[style,bridgePlans.filter(p=>p.style===style).length])),floors:this.floorCount,rails:this.railCount,posts:this.postCount,objects:this.objects.length,visible:this.objects.filter(i=>i.visible).length,integration:this.integration.diagnostics,rotatedSprites:0};}
}
