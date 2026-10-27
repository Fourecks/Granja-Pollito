import Phaser from 'phaser';
import { jefaHousePlan } from './jefaHousePlan';

export class JefaHouseLayer {
 private objects:Phaser.GameObjects.Image[]=[];
 readonly interaction:Phaser.GameObjects.Zone;

 constructor(scene:Phaser.Scene,onSelect:(id:string)=>void,canInteract:()=>boolean){
  const {anchor,size,texture,garden,door}=jefaHousePlan;
  // Break up the clean oval shadow with an uneven turf/soil contact line so
  // the foundation visually sits in the meadow instead of hovering over it.
  const ground=scene.add.graphics().setDepth(anchor[1]-1);
  ground.fillStyle(0x382f20,.13).fillEllipse(anchor[0],anchor[1]-2,190,17);
  const patch=(points:Array<[number,number]>,color:number,alpha:number)=>{
   ground.fillStyle(color,alpha).fillPoints(points.map(([x,y])=>new Phaser.Math.Vector2(anchor[0]+x,anchor[1]+y)),true);
  };
  patch([[-91,-5],[-84,-10],[-70,-9],[-63,-12],[-48,-9],[-39,-11],[-26,-7],[-31,-2],[-50,-1],[-63,1],[-81,-1]],0x62503a,.68);
  patch([[-33,-5],[-25,-9],[-12,-7],[-3,-10],[11,-7],[18,-4],[13,0],[-2,1],[-18,-1],[-28,1]],0x70583d,.7);
  patch([[28,-6],[38,-10],[51,-7],[63,-10],[77,-6],[87,-3],[82,1],[66,0],[55,2],[40,-1],[31,1]],0x62503a,.68);
  // Small broken moss/grass pixels soften the join around the footings.
  ground.fillStyle(0x718a3f,.85);
  for(const [x,y,w] of [[-87,-5,5],[-75,-2,4],[-57,-4,5],[-40,-2,4],[-25,-3,3],[24,-2,4],[43,-4,4],[59,-1,5],[80,-3,4]] as const){
   ground.fillRect(anchor[0]+x,anchor[1]+y,w,2);
  }
  const house=scene.add.image(anchor[0],anchor[1],texture).setOrigin(.5,1).setDisplaySize(size,size).setDepth(anchor[1]+.2).setData('buildingId',jefaHousePlan.id);
  this.objects.push(house);
  for(const prop of garden){
   const sprite=scene.add.image(prop.x,prop.y,'vegetation',prop.name).setDisplaySize(prop.width,prop.height).setOrigin(.5,1).setDepth(prop.y);
   this.objects.push(sprite);
  }
  // The existing home interior is reused; the click target is the front door only.
  this.interaction=scene.add.zone(door[0],door[1],42,42).setDepth(door[1]+1).setInteractive({useHandCursor:true}).setData('buildingId',jefaHousePlan.id);
  this.interaction.on('pointerup',()=>{if(canInteract())onSelect('home');});
 }
 get diagnostics(){return {id:jefaHousePlan.id,objects:this.objects.length,door:'home'};}
}
