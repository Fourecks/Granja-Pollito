import Phaser from 'phaser';
import { CelebrationEvent } from './events/CelebrationEvent';
import { WorldScene } from './WorldScene';
import { CameraControls } from './camera';
import { createFrames, loadExteriorAssets } from './assets';
import { NavigationGrid, inside, type Point } from './navigation';
import { MAP, navigation, cowPen, worldObjects, mapDecorations, waterZones, bridge, type InteriorId } from '../data/world';
import { CELEBRATION_MODE, celebrationEntities, globalDestinations, gatheringPoints } from '../data/celebration';
import { entityCollision, EntitySystem } from './entities';
import type { FarmRuntime } from './types';
export class ExteriorScene extends WorldScene {
 private celebration?:CelebrationEvent; private water!:Phaser.GameObjects.Graphics; private crops!:Phaser.GameObjects.Graphics; private lastDiagnostic=0; private lastFrame=-1; private entering=false; private cropPlants:Array<{sprite:Phaser.GameObjects.Image;row:number;variation:number}>=[];
 constructor(runtime:FarmRuntime){super('Exterior',runtime);}
 preload(){loadExteriorAssets(this);this.load.on('loaderror',(file:Phaser.Loader.File)=>console.error(`No se pudo cargar ${file.key}`));}
 create(){
  createFrames(this);this.add.image(0,0,'exterior').setOrigin(0).setDisplaySize(MAP.width,MAP.height).setDepth(0);
  const worldNavigation={...navigation,obstacles:[...navigation.obstacles,...(CELEBRATION_MODE?celebrationEntities.map(entityCollision).filter((p):p is NonNullable<typeof p>=>!!p):[])]};
  this.nav=new NavigationGrid(worldNavigation,4);
  const camera=this.cameras.main,fit=Math.max(this.scale.width/MAP.width,this.scale.height/MAP.height);
  camera.setBounds(0,0,MAP.width,MAP.height).setZoom(this.scale.width/(Math.min(window.devicePixelRatio||1,2))<760?Math.max(fit,.82*Math.min(window.devicePixelRatio||1,2)):fit*1.03);
  camera.centerOn(this.scale.width/(Math.min(window.devicePixelRatio||1,2))<760?(CELEBRATION_MODE?805:470):MAP.width/2,this.scale.width/(Math.min(window.devicePixelRatio||1,2))<760?390:MAP.height/2);
  this.controls=new CameraControls(this,fit,2.4*Math.min(window.devicePixelRatio||1,2));
  const chickNav=new NavigationGrid(worldNavigation,2),cowNav=new NavigationGrid({...navigation,walkable:[cowPen]},7);
  for(const data of this.runtime.props.current.characters){const p=data.position; if(!p)continue;this.actor(data.id,data.kind==='cow'?'cow':'chick',[p.x,p.y],data.kind==='cow'?data.path??[]:[...globalDestinations].slice(this.actors.length%6).concat([[p.x,p.y]]),data.kind==='cow'?cowNav:data.zone==='estanque'?this.nav:chickNav,0,data.state==='sleeping');}
  for(const [i,p] of ([[310,355],[350,350],[240,332],[405,352]] as Point[]).entries())this.actor(`ambient-chick-${i}`,'chick',p,[[p[0]+10,p[1]+4],[p[0]-12,p[1]+7]],chickNav);
  this.actor('blanca','cow',[1235,310],[[1245,311],[1240,303],[1228,312]],cowNav);this.addWorkers();this.addDogs();
  this.createCrops();this.foregrounds();this.water=this.add.graphics().setDepth(1);this.crops=this.add.graphics().setDepth(1);
  for(const object of worldObjects){const hit=this.add.rectangle(object.x,object.y,object.hitWidth,object.hitHeight,0xffffff,0).setDepth(object.enter?3000:1800).setInteractive({useHandCursor:true});hit.on('pointerup',()=>{if(this.controls.moved)return;if(object.enter)void this.enter(object.enter);else this.runtime.props.current.onSelect(object.id);});}
  // Actors stay selectable above generous building hit regions.
  this.actors.forEach(a=>a.sprite.on('pointerup',()=>{if(!this.controls.moved)this.runtime.props.current.onSelect(a.id);}));
  const enter=(event:Event)=>{if(this.input.enabled)void this.enter((event as CustomEvent<InteriorId>).detail);};
  window.addEventListener('farm-enter',enter);this.events.once('shutdown',()=>window.removeEventListener('farm-enter',enter));
  if(CELEBRATION_MODE){this.createCelebration();this.celebration=new CelebrationEvent(this);}
  this.runtime.loading(false);camera.fadeIn(350);
 }
 private createCelebration(){
  const entities=new EntitySystem(this,entity=>{const action=entity.interaction;if(action?.kind==='message'){this.runtime.props.current.onSelect(entity.id);}else if(action?.kind==='launcher'){window.dispatchEvent(new Event('farm-surprise-request'));}else this.runtime.props.current.onSelect(entity.id);},()=>this.controls.moved);
  for(const entity of celebrationEntities)entities.add(entity);
  for(const message of celebrationEntities.filter(e=>e.interaction?.kind==='message'))this.add.text(message.position[0],message.position[1]-48,message.interaction!.text,{fontFamily:'Georgia',fontSize:'10px',fontStyle:'bold',color:'#ffebbb',wordWrap:{width:65},align:'center',resolution:2}).setOrigin(.5).setDepth(message.position[1]+.1);
  const bunting=this.add.graphics().setDepth(343);bunting.lineStyle(1,0x68492e);bunting.beginPath();
  for(let i=0;i<=30;i++){const x=658+i*10,y=281+Math.sin(i/30*Math.PI)*19;if(i)bunting.lineTo(x,y);else bunting.moveTo(x,y);if(i%2===0){bunting.fillStyle([0xf4a8b7,0xffd76d,0x99c8e4,0xfff6dc][i/2%4]);bunting.fillTriangle(x,y,x+10,y+2,x+5,y+16);bunting.fillStyle(0xffdf86);bunting.fillRect(x-1,y-2,3,3);}}bunting.strokePath();
  for(const x of [658,958]){bunting.fillStyle(0x75492c).fillRect(x-2,282,4,60);}
  const launcher=this.add.container(869,462).setDepth(463),g=this.add.graphics();g.fillStyle(0x614833).fillRect(-10,-7,20,10);for(let i=0;i<3;i++){g.fillStyle([0xf0aaaf,0xffce62,0x79a9c5][i]).fillRect(-7+i*6,-17,4,12);}launcher.add(g);launcher.setSize(32,34).setInteractive({useHandCursor:true}).on('pointerup',()=>{if(!this.controls.moved)window.dispatchEvent(new Event('farm-surprise-request'));});
  const tooltip=this.add.text(869,435,'🎆 Iniciar sorpresa',{fontSize:'11px',backgroundColor:'#fff5df',color:'#654529',padding:{x:5,y:4},resolution:2}).setOrigin(.5).setDepth(3001).setVisible(false);launcher.on('pointerover',()=>tooltip.setVisible(true));launcher.on('pointerout',()=>tooltip.setVisible(false));
  for(let i=0;i<12;i++){const home=this.nav.nearest([710+(i%6)*35,435+Math.floor(i/6)*18]);const a=this.actor(`celebration-chick-${i}`,'chick',home,[gatheringPoints[(i+4)%gatheringPoints.length],home],this.nav);a.variant=i%8;a.accessory=this.add.graphics();const g=a.accessory;
   if(i%8<2){g.fillStyle(i%8?0xfff8df:0xffcb48).fillRect(-6,-20,12,5).fillRect(-4,-24,8,5);g.fillStyle(0xad7e26).fillRect(-7,-19,14,2);}
   else if(i%8===2){g.lineStyle(1,0xc89778).lineBetween(5,-8,8,-31);g.fillStyle(0xf29dae).fillEllipse(8,-35,10,12);}
   else if(i%8===3){g.fillStyle(0x876747).fillRect(5,-13,2,12);g.fillStyle(0x8ea3aa).fillRect(2,-15,8,4);}
   else if(i%8===7){g.fillStyle(0xae733c).fillRect(5,-20,14,12);g.fillStyle(0xffdf85).fillRect(7,-18,10,2).fillRect(8,-14,8,2);}
  }
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
  super.update(time,delta);this.celebration?.update(time,delta);
  if(import.meta.env.DEV&&time-this.lastDiagnostic>500){this.lastDiagnostic=time;this.game.canvas.dataset.stage=this.celebration?.stage??'disabled';this.game.canvas.dataset.world=JSON.stringify({phase:this.celebration?.phase??'disabled',particles:this.celebration?.particles??0,fps:Math.round(this.game.loop.actualFps),actors:this.actors.map(a=>({id:a.id,x:Math.round(a.x),y:Math.round(a.y),state:a.state,route:a.route.length,target:a.eventTarget}))});}
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
