import Phaser from 'phaser';
import { bridges, waterfalls, MAP } from './mapConfig';
import { inside } from '../navigation';
import type { WorldMasks } from './terrain';
/** Independent, sparse native-pixel accents; waterfall art and placement are untouched. */
export class WaterfallFoamLayer {
 private graphics:Phaser.GameObjects.Graphics;private frame=-1;private pixels=0;
 constructor(scene:Phaser.Scene,private masks:WorldMasks){this.graphics=scene.add.graphics().setDepth(-7.7);}
 update(time:number,view:Phaser.Geom.Rectangle){
  const frame=Math.floor(time/125);if(frame===this.frame)return;this.frame=frame;const g=this.graphics;g.clear();this.pixels=0;
  const paint=(x:number,y:number,color:number,alpha:number,width=2,surfaceOnly=false)=>{
   x=Math.round(x/2)*2;y=Math.round(y/2)*2;
   if(x<0||y<0||x+width>=MAP.width||y>=MAP.height)return;
   if(!view.contains(x,y)||bridges.some(b=>inside([x,y],b.shape)))return;
   for(let dx=0;dx<width;dx+=2){const i=(Math.floor(y/2)*1536+Math.floor((x+dx)/2))*4;if(this.masks.water[i+3]<128||surfaceOnly&&(this.masks.cliffWalls??this.masks.cliffs)[i+3]>127)continue;g.fillStyle(color,alpha).fillRect(x+dx,y,2,2);this.pixels++;}
  };
  for(const [index,fall] of waterfalls.entries()){
   const phase=(frame+index*3)%12,lake=fall.riverId==='lake-outlet',radius=Math.min(11,fall.width*.28)*(lake?1.2:1);
   // Broken, shallow crest. Its geometry stays at the approved upper lip.
   for(let i=-3;i<=3;i++)if((i+phase+12)%4!==0)paint(fall.position[0]+i*3,fall.position[1]+(i%2?2:0),0xb8dfdf,.25+(phase+i+12)%3*.055);
   const bx=fall.foot[0],by=fall.foot[1]+4;
   // Local impact changes shape rather than translating the falling water sprite.
   for(let i=-3;i<=3;i++){
    const x=bx+i*radius/3,y=by+((phase+i+12)%3-1)*2;
    if((phase+i+12)%4!==0)paint(x,y,i%3?0xb6dede:0xe1eeeb,.40+(phase+i+12)%3*.06,i%2?2:4,true);
   }
   // Two or three short, broken wave fronts; later waves are quieter and disappear.
   const waves=lake?3:2;
   for(let wave=0;wave<waves;wave++){
    const age=(phase+wave*4)%12,t=age/12,r=radius+2+t*(lake?11:8),alpha=(1-t)*.25;
    for(const a of [.15,.65,1.15,1.8,2.4,2.95])paint(bx+Math.cos(a)*r,by+3+Math.sin(a)*r*.30,0xa8d3d7,alpha,2,true);
   }
   // Three tiny droplets, with pauses; immediate turbulence fades into the usual surface.
   for(let i=0;i<3;i++){const age=(phase+i*4)%12;if(age>5)continue;
    paint(bx+(i-1)*radius*.55,by-2-Math.sin(age/6*Math.PI)*5,0xdcece9,(1-age/8)*.45);
   }
   for(let i=0;i<3;i++){const age=(phase+i*3)%12;if(age>7)continue;paint(bx+(i-1)*4,by+7+age,0x8abfc9,(1-age/8)*.18,2,true);}
  }
 }
 get diagnostics(){return {independent:true,frames:12,fps:8,waterfalls:waterfalls.length,pixels:this.pixels,depth:-7.7};}
}
