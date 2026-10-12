import { WorldScene } from './WorldScene';
import { CameraControls } from './camera';
import { NavigationGrid, rectangle, type Point } from './navigation';
import { interiors } from '../data/interiors';
import type { InteriorId } from '../data/world';
import type { FarmRuntime } from './types';
export class InteriorScene extends WorldScene {
 private id:InteriorId; private leaving=false;
 constructor(runtime:FarmRuntime,id:InteriorId){super(`Interior-${id}`,runtime);this.id=id;this.interior=true;}
 preload(){this.load.image(`room-${this.id}`,interiors[this.id].asset);}
 create(){
  const config=interiors[this.id];this.add.image(0,0,`room-${this.id}`).setOrigin(0).setDisplaySize(1672,941).setDepth(0);
  this.nav=new NavigationGrid({width:1672,height:941,walkable:config.walkable,obstacles:config.obstacles},7);
  const c=this.cameras.main,fit=Math.max(this.scale.width/1672,this.scale.height/941);
  c.setBounds(0,0,1672,941).setZoom(Math.max(fit,this.scale.width<760?.72:fit)).centerOn(835,510);
  this.controls=new CameraControls(this,fit,2.4);
  if(this.id!=='home')this.addWorkers(this.id==='shed'?[[780,550],[850,590],[910,560]]:[[710,550],[830,560],[930,550]]);
  if(this.id==='coop'){
   for(let i=0;i<12;i++){const p:Point=[500+(i%4)*180,410+Math.floor(i/4)*70];this.actor(this.runtime.props.current.characters.filter(a=>a.kind==='chicken')[i]?.id??`inside-chick-${i}`,'chick',p,[[p[0]+40,p[1]+10],[p[0]-30,p[1]+15]],this.nav);}
  }else if(this.id==='barn'){
   const nav=new NavigationGrid({width:1672,height:941,walkable:[rectangle(1130,450,200,155)],obstacles:[]},10);
   this.actor('margarita','cow',[1175,535],[[1220,525],[1180,570]],nav);this.actor('blanca','cow',[1260,570],[[1230,580],[1260,540]],nav);
  }else if(this.id==='home')this.actor('la-jefa','worker',[910,580],[],this.nav,3);
  const exit=this.add.rectangle(835,822,225,155,0xffffff,0).setDepth(2000).setInteractive({useHandCursor:true});exit.on('pointerup',()=>{if(!this.controls.moved)this.exit();});
  const onExit=()=>{if(this.runtime.room===this.id)this.exit();};window.addEventListener('farm-exit',onExit);this.events.once('shutdown',()=>window.removeEventListener('farm-exit',onExit));
  this.runtime.loading(false);c.fadeIn(350);
 }
 private exit(){
  if(this.leaving)return;this.leaving=true;this.cameras.main.fadeOut(200);this.cameras.main.once('camerafadeoutcomplete',()=>{
   this.scene.setVisible(false);this.input.enabled=false;this.runtime.room=null;this.runtime.props.current.onLocation(null);
   const exterior=this.scene.get('Exterior');this.scene.setVisible(true,'Exterior');exterior.input.enabled=true;exterior.cameras.main.fadeIn(300);this.leaving=false;
  });
 }
}
