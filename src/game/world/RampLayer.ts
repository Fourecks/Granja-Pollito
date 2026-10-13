import Phaser from 'phaser';
import { inside } from '../navigation';
import { cliffFaces, ramps } from './mapConfig';
const pathWidths:Record<string,number>={'north-steps':30,'forest-pass':24,'west-pass':22,'coop-steps':24,'home-steps':24,'beach-west-steps':22,'beach-east-steps':36,'pier-steps':26};
/** Historical terrain passages are slopes/stairs, not bridges. Clip steps to the actual cliff. */
export class RampLayer {
 private objects:Phaser.GameObjects.Image[]=[];
 constructor(scene:Phaser.Scene){
  for(const ramp of ramps){
   const xs=ramp.shape.map(p=>p[0]),ys=ramp.shape.map(p=>p[1]),left=Math.floor(Math.min(...xs)/2)*2,top=Math.floor(Math.min(...ys)/2)*2;
   const w=Math.ceil((Math.max(...xs)-left)/2)+1,h=Math.ceil((Math.max(...ys)-top)/2)+1,c=document.createElement('canvas');c.width=w;c.height=h;
   const ctx=c.getContext('2d')!,image=ctx.createImageData(w,h),dx=ramp.to[0]-ramp.from[0],dy=ramp.to[1]-ramp.from[1],length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length;
   let stairPixels=0;
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const wx=left+x*2,wy=top+y*2;if(!inside([wx,wy],ramp.shape)||!cliffFaces.some(p=>inside([wx,wy],p)))continue;
    const vx=wx-ramp.from[0],vy=wy-ramp.from[1],across=-uy*vx+ux*vy,along=ux*vx+uy*vy,j=(y*w+x)*4,noise=(x*17+y*31)%7;
    if(Math.abs(across)>pathWidths[ramp.id]/2){image.data.set([116+noise,111+noise,91+noise,255],j);continue;}
    const step=((along%8)+8)%8;const color=step<2?[94,88,72]:step<4?[177,164,137]:[145+noise,137+noise,114+noise];image.data.set([...color,255],j);stairPixels++;
   }
   ctx.putImageData(image,0,0);const key=`terrain-stairs-${ramp.id}`;scene.textures.addCanvas(key,c);
   this.objects.push(scene.add.image(left,top,key).setOrigin(0).setScale(2).setDepth(-15.8).setData('terrainPassage',ramp.id).setData('stairPixels',stairPixels));
  }
 }
 update(view:Phaser.Geom.Rectangle){for(const image of this.objects)image.setVisible(Phaser.Geom.Rectangle.Overlaps(view,image.getBounds()));}
 get diagnostics(){return {stairs:this.objects.length,bridgeRails:0,clippedToHistoricalFaces:true};}
}
