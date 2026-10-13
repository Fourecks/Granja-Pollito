import Phaser from 'phaser';
import { inside } from '../navigation';
import { cliffFaces, ramps, bridges } from './mapConfig';
import { cliffRockColor } from './terrain';
const pathWidths:Record<string,number>={'north-steps':30,'forest-pass':24,'west-pass':22,'coop-steps':24,'home-steps':24,'beach-west-steps':22,'beach-east-steps':36,'pier-steps':26};
/** Historical terrain passages are slopes/stairs, not bridges. Clip steps to the actual cliff. */
export class RampLayer {
 private objects:Phaser.GameObjects.Image[]=[];
 constructor(scene:Phaser.Scene){
  for(const ramp of ramps){
   const connected=ramp.id==='pier-steps'?bridges.find(b=>b.id==='fishing-pier'):undefined;
   const visual=connected??ramp;
   let wood:{pixels:Uint8ClampedArray;width:number;height:number}|undefined;
   if(connected){const sheet=scene.textures.get('bridge-rustic'),f=sheet.get('planks'),c=document.createElement('canvas');c.width=f.cutWidth;c.height=f.cutHeight;const ctx=c.getContext('2d')!;ctx.drawImage(sheet.getSourceImage() as HTMLImageElement,f.cutX,f.cutY,f.cutWidth,f.cutHeight,0,0,c.width,c.height);wood={pixels:ctx.getImageData(0,0,c.width,c.height).data,width:c.width,height:c.height};}
   const pixel=connected?1:2,xs=ramp.shape.map(p=>p[0]),ys=ramp.shape.map(p=>p[1]),left=Math.floor(Math.min(...xs)/pixel)*pixel,top=Math.floor(Math.min(...ys)/pixel)*pixel;
   const w=Math.ceil((Math.max(...xs)-left)/pixel)+1,h=Math.ceil((Math.max(...ys)-top)/pixel)+1,c=document.createElement('canvas');c.width=w;c.height=h;
   const ctx=c.getContext('2d')!,image=ctx.createImageData(w,h),dx=visual.to[0]-visual.from[0],dy=visual.to[1]-visual.from[1],length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length;
   let stairPixels=0;
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const wx=left+x*pixel,wy=top+y*pixel;if(!inside([wx,wy],ramp.shape)||!cliffFaces.some(p=>inside([wx,wy],p)))continue;
    const vx=wx-visual.from[0],vy=wy-visual.from[1],across=-uy*vx+ux*vy,along=ux*vx+uy*vy,j=(y*w+x)*4,noise=(x*17+y*31)%7;
    if(Math.abs(across)>pathWidths[ramp.id]/2){
     image.data.set(connected?[...cliffRockColor(Math.floor(wx/2),Math.floor(wy/2)),255]:[116+noise,111+noise,91+noise,255],j);
     continue;
    }
    const step=connected?((along+12)%9+9)%9:((along%8)+8)%8;let color=step<2?[94,88,72]:step<4?[177,164,137]:[145+noise,137+noise,114+noise];
    if(wood){const span=Math.max(4,wood.width-32),rows=Math.max(4,Math.floor(wood.height/5)-18),sx=16+((Math.floor((across+80)*5)%span)+span)%span,sy=8+((Math.floor((along+100)*3)%rows)+rows)%rows,k=(sy*wood.width+sx)*4;
     const base=wood.pixels[k+3]<128?[166,105,45]:[wood.pixels[k],wood.pixels[k+1],wood.pixels[k+2]],shade=step<1?-46:step<2?8:0;color=base.map(v=>Math.max(0,Math.min(255,v+shade)));
    }
    image.data.set([...color,255],j);stairPixels++;
   }
   ctx.putImageData(image,0,0);const key=`terrain-stairs-${ramp.id}`;scene.textures.addCanvas(key,c);
   this.objects.push(scene.add.image(left,top,key).setOrigin(0).setScale(pixel).setDepth(-15.8).setData('terrainPassage',ramp.id).setData('stairPixels',stairPixels).setData('integratedBridge',connected?.id??null));
  }
 }
 update(view:Phaser.Geom.Rectangle){for(const image of this.objects)image.setVisible(Phaser.Geom.Rectangle.Overlaps(view,image.getBounds()));}
 get diagnostics(){return {stairs:this.objects.length,bridgeRails:0,clippedToHistoricalFaces:true};}
}
