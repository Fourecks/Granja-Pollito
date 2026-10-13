import Phaser from 'phaser';
import { MAP, waterfalls, bridges, cliffFaces } from './mapConfig';
import { inside } from '../navigation';
import type { WaterfallPlacement } from './waterfallGeometry';
import type { WorldMasks } from './terrain';
import { submergedRockColor } from './SubmergedCliffLayer';
import { WaterfallFoamLayer } from './WaterfallFoamLayer';
import { WaterHabitat } from './waterHabitat';
export class WaterLayer {
 private ripples:Phaser.GameObjects.Graphics;private lastFrame=-1;
 readonly habitat:WaterHabitat;
 private layers:Phaser.GameObjects.Image[]=[];private cullAt=0;private textureBytes=0;
 private falls:Phaser.GameObjects.Sprite[]=[];private ticks=0;
 private rocks:Phaser.GameObjects.Image[]=[];
 private riverColors=new Uint8ClampedArray(1536*1024*3);
 private foam:WaterfallFoamLayer;
 constructor(private scene:Phaser.Scene,private masks:WorldMasks,private submergedFade?:Float32Array){
  this.habitat=new WaterHabitat(masks);this.createDepthLayers();
  this.ripples=scene.add.graphics().setDepth(-12);
  this.foam=new WaterfallFoamLayer(scene,masks);
  for(const [index,fall] of waterfalls.entries()){
   const kind=fall.kind,key=`waterfall-${kind}`,sheet=scene.textures.get(key),frames=6;
   const left=Math.floor((Math.min(...fall.flow.map(p=>p[0]))-fall.width-8)/2)*2,top=Math.floor((fall.position[1]-14)/2)*2;
   const width=Math.ceil((Math.max(...fall.flow.map(p=>p[0]))+fall.width+8-left)/2),height=Math.ceil((fall.foot[1]+24-top)/2);
   const runtimeKey=`topographic-${fall.id}`,atlas=scene.textures.createCanvas(runtimeKey,width*frames,height)!;
   const ctx=atlas.getContext();ctx.imageSmoothingEnabled=false;
   for(let n=0;n<frames;n++){const image=this.dropFrame(fall,sheet.get(String(n)),sheet.getSourceImage() as HTMLImageElement,left,top,width,height);ctx.putImageData(image,n*width,0);atlas.add(String(n),0,n*width,0,width,height);}atlas.refresh();
   const anim=`topographic-${fall.id}-flow`;if(!scene.anims.exists(anim))scene.anims.create({key:anim,frames:Array.from({length:frames},(_,frame)=>({key:runtimeKey,frame:String(frame)})),frameRate:7,repeat:-1});
   this.falls.push(scene.add.sprite(left,top,runtimeKey,'0').setOrigin(0).setScale(2).setDepth(-7.8).play({key:anim,startFrame:index%frames}));
   // Keep mossy shoulders at the actual lip, independently of the length of falling water.
   const rock=scene.textures.get('bridge-stone').get('stone');
   for(const side of [-1,1])this.rocks.push(scene.add.image(fall.position[0]+side*(fall.width+4),fall.position[1]+12,'bridge-stone','stone').setOrigin(.5,1).setScale(25/rock.height).setDepth(-7.9));
   if(fall.historical){const original=sheet.get('0');
    for(const [side,x0] of [[-1,0],[1,.62]]){const name=`historical-rock-${side}`,fh=Math.floor(original.cutHeight*.49),fw=Math.floor(original.cutWidth*.38);
     const c=document.createElement('canvas');c.width=fw;c.height=fh;const ctx=c.getContext('2d')!;
     ctx.drawImage(sheet.getSourceImage() as HTMLImageElement,original.cutX+Math.floor(original.cutWidth*x0),original.cutY+Math.floor(original.cutHeight*.18),fw,fh,0,0,fw,fh);
     const data=ctx.getImageData(0,0,fw,fh);for(let i=0;i<data.data.length;i+=4){const r=data.data[i],g=data.data[i+1],b=data.data[i+2];if(b>r*1.02&&b>g*.88||r>200&&g>220&&b>220)data.data[i+3]=0;}ctx.putImageData(data,0,0);scene.textures.addCanvas(name,c);
     this.rocks.push(scene.add.image(fall.foot[0]+side*(fall.width-8),fall.foot[1],name).setOrigin(side<0?1:0,1).setScale(55/fh).setDepth(-7.9));
    }
   }

  }
 }
 private dropFrame(fall:WaterfallPlacement,frame:Phaser.Textures.Frame,source:HTMLImageElement,left:number,top:number,w:number,h:number){
  const src=document.createElement('canvas');src.width=frame.cutWidth;src.height=frame.cutHeight;const sc=src.getContext('2d')!;
  sc.drawImage(source,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,0,0,src.width,src.height);const pixels=sc.getImageData(0,0,src.width,src.height).data;
  const output=new ImageData(w,h),drop=fall.foot[1]-fall.position[1];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const wx=left+x*2,wy=top+y*2,j=(y*w+x)*4,mask=(Math.floor(wy/2)*1536+Math.floor(wx/2))*4;if(this.masks.water[mask+3]<128)continue;
   let center=fall.position[0];
   if(wy>=fall.foot[1])center=fall.foot[0];else if(wy>fall.position[1])for(let n=1;n<fall.flow.length;n++){const a=fall.flow[n-1],b=fall.flow[n];if(wy<=b[1]){center=a[0]+(b[0]-a[0])*(wy-a[1])/(b[1]-a[1]);break;}}
   const across=(wx-center)/fall.width;if(Math.abs(across)>1)continue;
   const falling=fall.historical?wy>=fall.position[1]&&wy<=fall.foot[1]:inside([wx,wy],cliffFaces[fall.cliffIndex]),t=Math.max(0,Math.min(1,(wy-fall.position[1])/drop));
   let sx:number,sy:number;
   if(falling){sx=Math.round(src.width*(.5+across*.085));sy=Math.round(src.height*(.35+t*.29));}
   else if(wy<fall.position[1]){sx=Math.round(src.width*(.5+across*.12));sy=Math.round(src.height*(.24+(wy-fall.position[1]+14)/14*.10));}
   else {sx=Math.round(src.width*(.5+across*.24));sy=Math.round(src.height*(.66+(wy-fall.foot[1])/24*.27));}
   sx=Math.max(0,Math.min(src.width-1,sx));sy=Math.max(0,Math.min(src.height-1,sy));const i=(sy*src.width+sx)*4;
   const blue=pixels[i+2]>pixels[i]*1.02&&pixels[i+2]>pixels[i+1]*.88;
   const q=Math.floor(mask/4)*3,river=[this.riverColors[q],this.riverColors[q+1],this.riverColors[q+2]];
   const sample=blue?[pixels[i],pixels[i+1],pixels[i+2]]:river;
   const bright=sample[1]>170&&sample[2]>190;
   // The current river is the literal 75% base; highlights occupy restrained lip/streak/impact regions.
   const light=bright&&((falling&&t<.07)||(!falling&&wy>=fall.foot[1]&&wy<fall.foot[1]+5)||falling&&x%11<3)? .50:.25;
   const color=river.map((v,k)=>Math.round(v*(1-light)+sample[k]*light));
   const edge=Math.min(1,(1-Math.abs(across))*7);
   const fade=wy<fall.position[1]?Math.max(0,(wy-fall.position[1]+14)/14):wy>=fall.foot[1]?Math.max(0,1-(wy-fall.foot[1])/20):1;
   const alpha=Math.round(255*edge*fade);output.data.set([...color,alpha],j);
  }
  return output;
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
    floor.data[j+3]=255;water.data[j+3]=Math.round(255*Math.min(.40+.58*t,.98-(this.submergedFade?.[i]??0)*.30));
    const a=water.data[j+3]/255,rockAlpha=Math.round(230*(this.submergedFade?.[i]??0))/255,rockColor=submergedRockColor(gx,gy);
    for(let k=0;k<3;k++){const bed=rockColor[k]*rockAlpha+floor.data[j+k]*(1-rockAlpha);this.riverColors[i*3+k]=Math.round(bed*(1-a)+water.data[j+k]*a);}
   }
   if(!filled)continue;bc.putImageData(floor,0,0);sc.putImageData(water,0,0);
   for(const [name,c,depth] of [['riverbed',bed,-29],['water-depth',surface,-28]] as const){
    const key=`${name}-${cx}-${cy}`;if(this.scene.textures.exists(key))this.scene.textures.remove(key);this.scene.textures.addCanvas(key,c);
    this.layers.push(this.scene.add.image(cx*MAP.pixel,cy*MAP.pixel,key).setOrigin(0).setScale(MAP.pixel).setDepth(depth));this.textureBytes+=side*side*4;
   }
  }
 }
 update(time:number){
  this.foam.update(time,this.scene.cameras.main.worldView);
  if(time>=this.cullAt){this.cullAt=time+180;const view=this.scene.cameras.main.worldView;for(const image of [...this.layers,...this.rocks])image.setVisible(Phaser.Geom.Rectangle.Overlaps(view,image.getBounds()));}
  const frame=Math.floor(time/140);if(frame===this.lastFrame)return;this.lastFrame=frame;this.ticks++;
  const view=this.scene.cameras.main.worldView,w=MAP.width/2,mask=this.masks.water,g=this.ripples;g.clear();
  const inWater=(x:number,y:number)=>{const i=(Math.floor(y/2)*w+Math.floor(x/2))*4;return x>=0&&y>=0&&x<MAP.width&&y<MAP.height&&mask[i+3]>127&&(this.masks.cliffWalls??this.masks.cliffs)[i+3]<128;};
  for(let y=Math.max(0,Math.floor(view.top/40)*40);y<Math.min(MAP.height,view.bottom+40);y+=40)for(let x=Math.max(0,Math.floor(view.left/44)*44);x<Math.min(MAP.width,view.right+44);x+=44){
   const index=Math.floor(x/44)+Math.floor(y/40)*17,px=x+index%19+(frame+index)%8*2,py=y+index%13;
   if(!inWater(px,py)||!inWater(px+18,py)||bridges.some(b=>inside([px,py],b.shape)))continue;
   g.fillStyle(index%3===0?0xabe6df:0x58c0d3,.28+(frame+index)%3*.06);g.fillRect(px,py,8+index%5*2,2);if(index%4===0)g.fillRect(px+4,py+4,6,2);
  }
  for(const f of this.falls){const visible=Phaser.Geom.Rectangle.Overlaps(view,f.getBounds());f.setVisible(visible);if(visible)f.anims.resume();else f.anims.pause();}
 }
 get diagnostics(){return {mode:'reference-layered-pixel-art',shader:false,foam:this.foam.diagnostics,waterfalls:this.falls.length,placements:waterfalls.map(f=>({id:f.id,cliff:f.cliffId,top:f.position,bottom:f.foot})),fallFrames:this.falls.map(f=>String(f.frame.name)),mediumFrames:6,smallFrames:6,depthLayers:this.layers.length,visibleLayers:this.layers.filter(i=>i.visible).length,estimatedTextureMiB:Math.round(this.textureBytes/1048576*10)/10};}
 get animationFrame(){return this.ticks;}
}
