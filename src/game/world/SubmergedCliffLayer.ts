import Phaser from 'phaser';
import { MAP, cliffs, cliffFaces } from './mapConfig';
import type { WorldMasks } from './terrain';
export function submergedRockColor(gx:number,gy:number){
 const wave=Math.floor(Math.sin(gx/8)*2+Math.sin(gx/19)*3),row=Math.floor((gy+wave)/14),edge=(gx+(row%2)*11+Math.floor(Math.sin(gy/6)*2))%23;
 const seam=(gy+wave)%14===0||edge===0,shade=seam?-24:edge<3?10:edge>18?-8:0;return [117+shade,115+shade,109+shade];
}
/** A render-only continuation of the historical lower edge, below the water surface. */
export class SubmergedCliffLayer {
 readonly fade=new Float32Array(1536*1024);
 private objects:Phaser.GameObjects.Image[]=[];private pixels=0;
 constructor(scene:Phaser.Scene,masks:WorldMasks){
  const W=1536,H=1024,wall=masks.cliffWalls??masks.cliffs;
  for(let ci=0;ci<cliffs.length;ci++){
   const lower=cliffFaces[ci].slice(cliffs[ci].line.length).reverse();
   for(let i=1;i<lower.length;i++){
    const a=lower[i-1],b=lower[i],left=Math.ceil(Math.min(a[0],b[0])/2),right=Math.floor(Math.max(a[0],b[0])/2);if(Math.abs(b[0]-a[0])<.01)continue;
    for(let x=Math.max(0,left);x<=Math.min(W-1,right);x++){
     const edge=a[1]+(b[1]-a[1])*(x*2-a[0])/(b[0]-a[0]);
     for(let y=Math.max(0,Math.ceil(edge/2));y<Math.min(H,Math.ceil((edge+30)/2));y++){
      const index=y*W+x,d=y*2-edge;if(masks.water[index*4+3]<128||wall[index*4+3]>127)continue;
      this.fade[index]=Math.max(this.fade[index],Math.pow(Math.max(0,1-d/30),1.6));
     }
    }
   }
  }
  const side=MAP.chunk/2;
  for(let cy=0;cy<H;cy+=side)for(let cx=0;cx<W;cx+=side){
   const c=document.createElement('canvas');c.width=c.height=side;const ctx=c.getContext('2d')!,image=ctx.createImageData(side,side);let filled=false;
   for(let y=0;y<side;y++)for(let x=0;x<side;x++){
    const gx=cx+x,gy=cy+y,f=this.fade[gy*W+gx];if(!f)continue;filled=true;this.pixels++;
    // Same native block sizes as the dry wall, with restrained achromatic contrast.
    image.data.set([...submergedRockColor(gx,gy),Math.round(230*f)],(y*side+x)*4);
   }
   if(!filled)continue;ctx.putImageData(image,0,0);const key=`submerged-cliff-${cx}-${cy}`;scene.textures.addCanvas(key,c);
   this.objects.push(scene.add.image(cx*2,cy*2,key).setOrigin(0).setScale(2).setDepth(-28.5));
  }
 }
 update(view:Phaser.Geom.Rectangle){for(const o of this.objects)o.setVisible(Phaser.Geom.Rectangle.Overlaps(view,o.getBounds()));}
 get diagnostics(){return {pixels:this.pixels,chunks:this.objects.length,depth:-28.5,surfaceAbove:true,maxContinuation:30};}
}
