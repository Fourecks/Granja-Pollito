import Phaser from 'phaser';
import { ruralGates, advanceGate, type GateActor } from './ruralGates';
export class RuralGateLayer {
 private graphics:Phaser.GameObjects.Graphics[]=[];
 private rendered=new Map<string,number>();
 constructor(scene:Phaser.Scene){for(const g of ruralGates){g.open=false;g.progress=0;g.holdUntil=0;this.graphics.push(scene.add.graphics().setDepth(Math.max(g.a[1],g.b[1])+.2));}}
 update(time:number,delta:number,actors:readonly GateActor[]){
  ruralGates.forEach((gate,i)=>{advanceGate(gate,actors,time,delta);if(this.rendered.get(gate.id)===gate.progress)return;this.rendered.set(gate.id,gate.progress);const g=this.graphics[i];g.clear();
   const dx=(gate.b[0]-gate.a[0])/2,dy=(gate.b[1]-gate.a[1])/2,sign=dx===0?1:-1,angle=gate.progress*Math.PI/2;
   const leaf=(x:number,y:number,vx:number,vy:number,a:number)=>{const ex=x+vx*Math.cos(a)-vy*Math.sin(a),ey=y+vx*Math.sin(a)+vy*Math.cos(a);const pixelLine=(ax:number,ay:number,bx:number,by:number,color:number,width:number)=>{g.fillStyle(color);const n=Math.ceil(Math.hypot(bx-ax,by-ay)/2);for(let k=0;k<=n;k++){const t=k/(n||1);g.fillRect(Math.round((ax+(bx-ax)*t)/2)*2,Math.round((ay+(by-ay)*t)/2)*2,width,2);}};
    for(const h of [11,22]){pixelLine(x,y-h,ex,ey-h,0x60432a,4);pixelLine(x,y-h-1,ex,ey-h-1,0xb58c51,2);}
    pixelLine(x,y-23,x,y-3,0x805c35,3);pixelLine(ex,ey-23,ex,ey-3,0x805c35,3);pixelLine(x,y-21,ex,ey-10,0x9c7542,2);
   };
   leaf(...gate.a,dx,dy,angle*sign);leaf(...gate.b,-dx,-dy,-angle*sign);
  });
 }
 get diagnostics(){return ruralGates.map(g=>({id:g.id,open:g.open,progress:Math.round(g.progress*100)}));}
}
