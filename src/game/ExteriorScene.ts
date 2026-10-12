import Phaser from 'phaser';
import { WorldScene } from './WorldScene';
import { CameraControls } from './camera';
import { createFrames, loadExteriorAssets } from './assets';
import { NavigationGrid, inside, type Point } from './navigation';
import { MAP, navigation, coopPen, cowPen, worldObjects, mapDecorations, waterZones, bridge, type InteriorId } from '../data/world';
import type { FarmRuntime } from './types';
export class ExteriorScene extends WorldScene {
 private water!:Phaser.GameObjects.Graphics; private crops!:Phaser.GameObjects.Graphics; private lastFrame=-1; private entering=false; private cropPlants:Array<{sprite:Phaser.GameObjects.Image;row:number;variation:number}>=[];
 constructor(runtime:FarmRuntime){super('Exterior',runtime);}
 preload(){loadExteriorAssets(this);this.load.on('loaderror',(file:Phaser.Loader.File)=>console.error(`No se pudo cargar ${file.key}`));}
 create(){
  createFrames(this);this.add.image(0,0,'exterior').setOrigin(0).setDisplaySize(MAP.width,MAP.height).setDepth(0);
  this.nav=new NavigationGrid(navigation,4);
  const camera=this.cameras.main,fit=Math.max(this.scale.width/MAP.width,this.scale.height/MAP.height);
  camera.setBounds(0,0,MAP.width,MAP.height).setZoom(this.scale.width<760?Math.max(fit,.82):fit*1.03);
  camera.centerOn(this.scale.width<760?470:MAP.width/2,this.scale.width<760?390:MAP.height/2);
  this.controls=new CameraControls(this,fit,2.4);
  const chickNav=new NavigationGrid({...navigation,walkable:[coopPen]},2),cowNav=new NavigationGrid({...navigation,walkable:[cowPen]},7);
  for(const data of this.runtime.props.current.characters){const p=data.position; if(!p)continue;this.actor(data.id,data.kind==='cow'?'cow':'chick',[p.x,p.y],data.path??[],data.kind==='cow'?cowNav:data.zone==='estanque'?this.nav:chickNav,0,data.state==='sleeping');}
  for(const [i,p] of ([[310,355],[350,350],[240,332],[405,352]] as Point[]).entries())this.actor(`ambient-chick-${i}`,'chick',p,[[p[0]+10,p[1]+4],[p[0]-12,p[1]+7]],chickNav);
  this.actor('blanca','cow',[1235,310],[[1245,311],[1240,303],[1228,312]],cowNav);this.addWorkers();
  this.createCrops();this.foregrounds();this.water=this.add.graphics().setDepth(1);this.crops=this.add.graphics().setDepth(1);
  for(const object of worldObjects){const hit=this.add.rectangle(object.x,object.y,object.hitWidth,object.hitHeight,0xffffff,0).setDepth(object.enter?3000:1800).setInteractive({useHandCursor:true});hit.on('pointerup',()=>{if(this.controls.moved)return;if(object.enter)void this.enter(object.enter);else this.runtime.props.current.onSelect(object.id);});}
  // Actors stay selectable above generous building hit regions.
  this.actors.forEach(a=>a.sprite.on('pointerup',()=>{if(!this.controls.moved)this.runtime.props.current.onSelect(a.id);}));
  const enter=(event:Event)=>{if(this.input.enabled)void this.enter((event as CustomEvent<InteriorId>).detail);};
  window.addEventListener('farm-enter',enter);this.events.once('shutdown',()=>window.removeEventListener('farm-enter',enter));
  this.runtime.loading(false);camera.fadeIn(350);
 }
 private createCrops(){
  for(let bed=0;bed<2;bed++)for(let row=0;row<3;row++)for(let col=0;col<5;col++){
   const x=(bed?561:455)+col*19-row*17,y=(bed?543:512)+col*4+row*10;
   const plant=this.add.image(x,y,'crop-stages',bed?7:11).setDisplaySize(bed?31:34,bed?31:38).setOrigin(.5,.91).setDepth(y);
   this.cropPlants.push({sprite:plant,row:bed?1:col%2?0:2,variation:(row+col)%4});
  }
 }
 private foregrounds(){
  const source=this.textures.get('exterior').getSourceImage() as HTMLImageElement;
  for(const layer of mapDecorations){const xs=layer.polygon.map(p=>p[0]),ys=layer.polygon.map(p=>p[1]);const x=Math.floor(Math.min(...xs)),y=Math.floor(Math.min(...ys)),w=Math.ceil(Math.max(...xs)-x),h=Math.ceil(Math.max(...ys)-y);
   const texture=this.textures.createCanvas(layer.id,w,h)!;const ctx=texture.context;ctx.imageSmoothingEnabled=false;ctx.beginPath();layer.polygon.forEach((p,i)=>i?ctx.lineTo(p[0]-x,p[1]-y):ctx.moveTo(p[0]-x,p[1]-y));ctx.closePath();ctx.clip();ctx.drawImage(source,-x,-y,MAP.width,MAP.height);texture.refresh();this.add.image(x,y,layer.id).setOrigin(0).setDepth(layer.depth);
  }
 }
 async enter(id:InteriorId){
  if(this.entering||this.runtime.room)return;this.entering=true;this.runtime.props.current.onSelect('');
  this.runtime.loading(true);
  try{
   const {InteriorScene}=await import('./InteriorScene');
   if(!this.runtime.loadedRooms.has(id)){this.scene.add(`Interior-${id}`,new InteriorScene(this.runtime,id),false);this.runtime.loadedRooms.add(id);}
   this.cameras.main.fadeOut(200);this.cameras.main.once('camerafadeoutcomplete',()=>{
    this.scene.setVisible(false);this.input.enabled=false;this.runtime.room=id;this.runtime.props.current.onLocation(id);
    const key=`Interior-${id}`;if(this.scene.isActive(key)){const scene=this.scene.get(key);this.scene.setVisible(true,key);scene.input.enabled=true;scene.cameras.main.fadeIn(300);this.runtime.loading(false);}else this.scene.launch(key);
    this.entering=false;
   });
  }catch(error){console.error(error);this.runtime.loading(false);this.entering=false;}
 }
 update(time:number,delta:number){
  super.update(time,delta);
  const state=this.runtime.props.current.state,elapsed=state.tasks['water-crops'].lastRunAt?Date.now()-state.tasks['water-crops'].lastRunAt!:Infinity;
  const growth=state.cropsWatered?Math.min(3,1+Math.floor(elapsed/1200000)):0;
  for(const plant of this.cropPlants)plant.sprite.setFrame(plant.row*4+(plant.variation===3?growth:plant.variation===2?2:3));
  const frame=Math.floor(time/170)%8;if(frame===this.lastFrame||!this.water)return;this.lastFrame=frame;this.water.clear();this.crops.clear();
  // Eight discrete pixel ripple frames, clipped to authored water polygons. No CSS effects.
  for(let i=0;i<145;i++){const x=1180+(i*53)%490,y=225+(i*97)%500;if(!waterZones.some(poly=>inside([x,y],poly))||inside([x,y],bridge))continue;
   this.water.fillStyle(i%3===0?0xc1f2e4:0x72cbdc,.17+((i+frame)%5)*.04);this.water.fillRect(x+(frame+i)%8-4,y,5+(i%4)*3,1+(i%2));}
  for(let i=0;i<8;i++){this.water.fillStyle(0xe1fff0,.35);this.water.fillRect(1602+i%3*5,162+(i*13+frame*4)%69,2,7);}
  if(this.runtime.props.current.state.cropsWatered){for(let i=0;i<32;i++){const x=440+(i*37)%240,y=505+(i*11)%72;this.crops.fillStyle(i%2?0xa2e4dc:0x40786c,.24);this.crops.fillRect(x,y,3,2);if((i+frame)%8===0){this.crops.fillStyle(0xdefff3,.6);this.crops.fillRect(x,y-6,1,4);}}}
 }
}
