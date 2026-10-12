import Phaser from 'phaser';
import { type Point, type Polygon } from './navigation';
export interface WorldEntity {
 id:string; position:Point; sprite?:{key:string;frame?:number;size:Point;origin?:Point};
 collision?:Polygon; interaction?:{kind:'message'|'detail'|'launcher'|'select'|'enter';text:string}; depthAnchor:number;
}
export const entityCollision=(entity:WorldEntity):Polygon|undefined=>entity.collision?.map(([x,y])=>[x+entity.position[0],y+entity.position[1]] as Point);
export class EntitySystem {
 readonly entities=new Map<string,{data:WorldEntity;view?:Phaser.GameObjects.Image}>();
 constructor(private scene:Phaser.Scene,private interact:(entity:WorldEntity)=>void,private moved:()=>boolean){}
 add(data:WorldEntity){
  const sprite=data.sprite;let view:Phaser.GameObjects.Image|undefined;
  if(sprite){this.scene.add.ellipse(...data.position,sprite.size[0]*.65,8,0x33252c,.25).setDepth(data.position[1]-.1);
   view=this.scene.add.image(...data.position,sprite.key,sprite.frame??0).setDisplaySize(...sprite.size).setOrigin(...(sprite.origin??[.5,1])).setDepth(data.position[1]+data.depthAnchor);
   if(data.interaction){view.setInteractive({useHandCursor:true});view.on('pointerup',()=>{if(!this.moved())this.interact(data);});}
  }
  this.entities.set(data.id,{data,view});return view;
 }
}
