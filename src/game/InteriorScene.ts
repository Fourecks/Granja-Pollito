import Phaser from 'phaser';
import { InteriorLayers } from './interiors/InteriorLayers';
import { createCowFrames } from './assets';
import { animalTexture } from './world/LivestockLayer';
import { WorldScene } from './WorldScene';
import { CameraControls } from './camera';
import { NavigationGrid, type Point } from './navigation';
import { interiors, type CareStation, type InteriorData } from '../data/interiors';
import type { InteriorId } from '../data/world';
import type { FarmRuntime } from './types';
import type { TaskId } from '../domain';
import type { Species } from './world/livestock';
interface InteriorAnimal {sprite:Phaser.GameObjects.Image;species:Species;variant:number;phase:number;frame:number;}
const speciesForTask:Partial<Record<TaskId,Species>>={
 'feed-chickens':'chicken','prepare-dust-bath':'chicken','feed-cows':'cow','collect-milk':'cow',
 'feed-goats':'goat','groom-goats':'goat','clean-goat-shelter':'goat',
 'feed-horses':'horse','brush-horses':'horse','wash-horses':'horse','clean-stable':'horse',
 'feed-rabbits':'rabbit','water-rabbits':'rabbit','clean-rabbit-hutch':'rabbit',
 'feed-pigs':'pig','mud-bath-pigs':'pig','clean-pig-pen':'pig',
};
const cleanupTask:Partial<Record<InteriorId,TaskId>>={'rabbit-hutch':'clean-rabbit-hutch',coop:'clean-coop','goat-shelter':'clean-goat-shelter','horse-stable':'clean-stable','pig-shelter':'clean-pig-pen'};
const animalHeight:Record<Species,number>={chicken:29,cow:102,horse:96,pig:59,goat:62,rabbit:43};
const animalWidth:Record<Species,number>={chicken:38,cow:136,horse:128,pig:79,goat:83,rabbit:57};
export class InteriorScene extends WorldScene {
 private layers!:InteriorLayers; private id:InteriorId; private leaving=false; private animals:InteriorAnimal[]=[]; private careFx!:Phaser.GameObjects.Graphics;
 private manureMarks:Phaser.GameObjects.Graphics[]=[]; private stationLabels=new Map<TaskId,Phaser.GameObjects.Text>(); private careTask?:TaskId;
 constructor(runtime:FarmRuntime,id:InteriorId){super(`Interior-${id}`,runtime);this.id=id;this.interior=true;}
 preload(){if(!this.textures.exists('cows'))this.load.image('cows','/assets/cows-v2.webp');}
 create(){
  createCowFrames(this);const config=interiors[this.id];
  this.layers=new InteriorLayers(this,this.id,()=>!this.controls?.moved,task=>this.runtime.props.current.onTaskRequest(task));
  this.nav=new NavigationGrid({width:1672,height:941,walkable:this.layers.walkable,obstacles:this.layers.obstacles,gates:this.layers.gates},7);
  const c=this.cameras.main,fit=Math.min(this.scale.width/1672,this.scale.height/941),ratio=Number(this.game.registry.get('renderRatio'))||1;
  c.setBounds(0,0,1672,941).setZoom(fit).centerOn(836,470);
  this.controls=new CameraControls(this,fit,2.4*ratio,{width:1672,height:941},true);
  if(this.id!=='home')this.addWorkers(this.id==='shed'?[[780,550],[850,590],[910,560]]:[[710,550],[830,590],[930,560]]);
  if(this.id==='home')this.actor('la-jefa','worker',[910,580],[],this.nav,3);
  this.addInteriorAnimals(config.animals);
  this.addManure(config.manure);
  this.careFx=this.add.graphics().setDepth(1700);
  this.addCareStations(config.stations);
  const exit=this.add.rectangle(835,822,225,155,0xffffff,0).setDepth(2000).setInteractive({useHandCursor:true});exit.on('pointerup',()=>{if(!this.controls.moved)this.exit();});
  const onExit=()=>{if(this.runtime.room===this.id)this.exit();};window.addEventListener('farm-exit',onExit);this.events.once('shutdown',()=>window.removeEventListener('farm-exit',onExit));
  this.runtime.loading(false);c.fadeIn(350);
 }
 private addInteriorAnimals(groups:InteriorData['animals']){
  for(const group of groups)group.points.forEach((point,index)=>{
   const variant=(index+groups.indexOf(group))%3;
   for(let frame=0;frame<8;frame++)animalTexture(this,group.species,variant,frame);
   const [x,y]=point,height=animalHeight[group.species],width=animalWidth[group.species];
   const shadow=this.add.ellipse(x,y,width*.72,height*.2,0x322619,.22).setDepth(y-.15);
   const sprite=this.add.image(x,y,`livestock-${group.species}-${variant}-4`).setOrigin(.5,.92).setDisplaySize(width,height).setDepth(y);
   sprite.setData('shadow',shadow);this.animals.push({sprite,species:group.species,variant,phase:index*310,frame:4});
  });
 }
 private addManure(points:Point[]){
  const clean=cleanupTask[this.id];if(!points.length||(clean&&this.runtime.props.current.state.tasks[clean].status==='done'))return;
  points.forEach(([x,y],index)=>{const g=this.add.graphics().setDepth(y+.3).setAlpha(.9);g.fillStyle(0x473427).fillRect(x-5,y-2,9,4).fillRect(x-2,y-5,5,4).fillRect(x+3,y-1,4,3);g.fillStyle(0x846b4d).fillRect(x-2,y-4,2,2).fillRect(x+2,y,2,1);g.setData('spot',index);this.manureMarks.push(g);});
 }
 private addCareStations(stations:CareStation[]){
  for(const station of stations){
   const [x,y]=station.point,board=this.add.graphics(),text=this.add.text(0,0,station.label,{fontFamily:'system-ui, sans-serif',fontSize:'12px',fontStyle:'600',color:'#fff3d3',align:'center'}).setOrigin(.5);
   const draw=(hover=false)=>{board.clear();board.fillStyle(hover?0x745033:0x533a28).fillRect(-66,-17,132,34);board.fillStyle(0xb68c53).fillRect(-66,-17,132,2).fillRect(-66,15,132,2).fillRect(-66,-17,2,34).fillRect(64,-17,2,34);board.fillStyle(0x392a20).fillRect(-60,-11,120,1);};
   draw();const container=this.add.container(x,y-45,[board,text]).setDepth(y+500).setSize(142,42).setInteractive(new Phaser.Geom.Rectangle(-71,-21,142,42),Phaser.Geom.Rectangle.Contains);
   container.on('pointerover',()=>{draw(true);container.setScale(1.04);});container.on('pointerout',()=>{draw();container.setScale(1);});container.on('pointerdown',()=>container.setScale(.97));container.on('pointerup',()=>{container.setScale(1.04);if(!this.controls.moved)this.runtime.props.current.onTaskRequest(station.task);});
   this.stationLabels.set(station.task,text);text.setData('label',station.label);
  }
 }
 protected onCareStart(task:TaskId){this.careTask=task;}
 protected onCareComplete(task:TaskId){
  this.layers.complete(task);
  if(cleanupTask[this.id]===task&&this.manureMarks.length){this.tweens.add({targets:this.manureMarks,alpha:0,duration:500,onComplete:()=>{this.manureMarks.forEach(mark=>mark.destroy());this.manureMarks=[];}});}
  if(this.careTask===task)this.careTask=undefined;
 }
 update(time:number,delta:number){
  if(!this.scene.isVisible())return;this.layers.update(time,delta,this.actors);super.update(time,delta);
  const state=this.runtime.props.current.state,active=this.runtime.props.current.activeTasks;
  for(const [task,label] of this.stationLabels){const original=String(label.getData('label')),done=state.tasks[task].status==='done',running=active.includes(task);label.setText(done?`✓ ${original}`:running?`${original}…`:original);}
  this.animals.forEach(animal=>{
   const shouldEat=(this.careTask?speciesForTask[this.careTask]:undefined)===animal.species&&(this.careTask?.startsWith('feed-')??false);
   const frame=shouldEat?6+Math.floor(time/260+animal.phase)%2:4+Math.floor(time/850+animal.phase)%2;
   if(frame!==animal.frame){animal.frame=frame;animal.sprite.setTexture(`livestock-${animal.species}-${animal.variant}-${frame}`);}
   const shadow=animal.sprite.getData('shadow') as Phaser.GameObjects.Ellipse;shadow.setPosition(animal.sprite.x,animal.sprite.y).setDepth(animal.sprite.y-.15);
  });
  this.careFx.clear();
  const targetSpecies=this.careTask?speciesForTask[this.careTask]:undefined;
  if(targetSpecies){
   const affected=this.animals.filter(animal=>animal.species===targetSpecies);
   affected.forEach((animal,index)=>{const phase=time/180+animal.phase,water=this.careTask==='wash-horses'||this.careTask==='mud-bath-pigs'||this.careTask==='water-rabbits';
    if(water){this.careFx.fillStyle(0x9ddded,.88).fillRect(Math.round(animal.sprite.x-18+Math.sin(phase)*12),Math.round(animal.sprite.y-54-Math.abs(Math.sin(phase))*7),3,4).fillRect(Math.round(animal.sprite.x+12+Math.cos(phase)*8),Math.round(animal.sprite.y-40-Math.abs(Math.cos(phase))*6),2,3);}
    else if(this.careTask==='prepare-dust-bath'){this.careFx.fillStyle(0xd8bd80,.75).fillRect(Math.round(animal.sprite.x-13+Math.sin(phase)*12),Math.round(animal.sprite.y-35-Math.abs(Math.cos(phase))*5),3,2);}
    else if(this.careTask?.startsWith('brush-')||this.careTask?.startsWith('groom-')){this.careFx.fillStyle(0xffe4a1,.9).fillRect(Math.round(animal.sprite.x-14+Math.sin(phase)*18),Math.round(animal.sprite.y-56-(index%2)*9),3,3).fillRect(Math.round(animal.sprite.x+13+Math.cos(phase)*16),Math.round(animal.sprite.y-44-(index%2)*5),2,2);}
    else if(this.careTask?.startsWith('feed-')){this.careFx.fillStyle(0xe2be70,.9).fillRect(Math.round(animal.sprite.x+18),Math.round(animal.sprite.y-23),3,2);}
   });
  }
 }
 private exit(){
  if(this.leaving)return;this.leaving=true;this.cameras.main.fadeOut(200);this.cameras.main.once('camerafadeoutcomplete',()=>{
   this.scene.setVisible(false);this.input.enabled=false;this.runtime.room=null;this.runtime.props.current.onLocation(null);
   const exterior=this.scene.get('Exterior');this.scene.setVisible(true,'Exterior');exterior.input.enabled=true;exterior.cameras.main.fadeIn(300);this.leaving=false;
  });
 }
}
