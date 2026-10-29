import Phaser from 'phaser';
import { NavigationGrid, type Point } from './navigation';
import { SCALE } from './world/mapConfig';
import { workers, taskRoutes } from '../data/routes';
import type { FarmRuntime } from './types';
import type { TaskId } from '../domain';
import { globalDestinations } from '../data/celebration';
import type { CameraControls } from './camera';
export interface Actor {
 id:string; kind:'chick'|'worker'|'cow'|'dog'; row:number; x:number; y:number; home:Point; patrol:Point[]; route:Point[]; step:number;
 sprite:Phaser.GameObjects.Sprite; shadow:Phaser.GameObjects.Ellipse; nav:NavigationGrid; nextPatrol:number; sleeping?:boolean; state:'IDLE'|'WALK'|'WORK'|'OBSERVE'|'CELEBRATE'|'RUN'|'SIT'|'SLEEP'|'FOLLOW'|'DANCE'|'LOOK_UP'; eventTarget?:Point; accessory?:Phaser.GameObjects.Graphics; variant?:number; workerChick?:boolean;
}
interface Job {task:TaskId;worker:Actor;phase:'walk'|'action';until:number;effect:Phaser.GameObjects.Container|null;}
export abstract class WorldScene extends Phaser.Scene {
 actors:Actor[]=[]; controls!:CameraControls; nav!:NavigationGrid;
 protected jobs=new Map<string,Job>(); protected interior=false;
 constructor(key:string,protected runtime:FarmRuntime){super(key);}
 protected actor(id:string,kind:Actor['kind'],point:Point,patrol:Point[],nav:NavigationGrid,row=0,sleeping=false):Actor {
  nav=nav.forGateAccess(kind==='worker');
  const initial=nav.nearest(point),factor=this.interior?2:1;
  const shadow=this.add.ellipse(initial[0],initial[1],(kind==='cow'?49:kind==='worker'?17:13)*factor,(kind==='cow'?13:5)*factor,0x543b26,.28).setDepth(initial[1]-.1);
  const sprite=this.add.sprite(...initial,kind==='cow'?'cows':kind==='dog'?'dogs':'actors',kind==='worker'||kind==='dog'?row*4:0)
   .setDisplaySize((kind==='cow'?80:kind==='worker'?SCALE.humanHeight:kind==='dog'?37:34)*factor,(kind==='cow'?80:kind==='worker'?SCALE.humanHeight:kind==='dog'?37:34)*factor)
   .setOrigin(.5,kind==='chick'?.79:kind==='cow'?.82:kind==='dog'?.9:.96).setDepth(initial[1]);
  sprite.setInteractive({useHandCursor:true});sprite.on('pointerup',()=>{if(!this.controls.moved)this.runtime.props.current.onSelect(id);});
  const actor:Actor={id,kind,row,x:initial[0],y:initial[1],home:initial,patrol,route:[],step:0,sprite,shadow,nav,nextPatrol:1000+this.actors.length*370,sleeping,state:sleeping?'SLEEP':'IDLE'};this.actors.push(actor);return actor;
 }
 isBusy(id:string){return this.runtime.busyWorkers.has(id);}
 protected addDogs(){const dogs=[this.actor('chispa','dog',[718,439],globalDestinations,this.nav,0),this.actor('nube-dog','dog',[848,448],[...globalDestinations].reverse(),this.nav,1)];dogs.forEach(dog=>dog.accessory=this.add.graphics());}
 protected addWorkers(points?:Point[]){workers.forEach((worker,i)=>this.actor(worker.id,'worker',points?.[i]??worker.home,points?[[points[i][0]+35,points[i][1]],[points[i][0]-25,points[i][1]+25]]:worker.path,this.nav,worker.row));}
 update(time:number,elapsed:number){
  const delta=Math.min(elapsed,80);this.controls?.update(delta);
  const props=this.runtime.props.current;
  for(const task of this.runtime.completed) if(!props.activeTasks.includes(task)){this.runtime.completed.delete(task);this.runtime.owners.delete(task);}
  for(const task of props.activeTasks){
   if(this.runtime.completed.has(task))continue;
   const route=taskRoutes[task],sceneId=this.sys.settings.key;
   const desired=this.runtime.room===route.room?`Interior-${route.room}`:'Exterior';
   if((this.runtime.owners.get(task)??desired)!==sceneId)continue;
   this.runtime.owners.set(task,sceneId);
   const assigned=props.state.tasks[task].assignedTo;
   const workerId=workers.some(w=>w.id===assigned)?assigned!:route.worker;
   if(this.jobs.has(workerId)||this.runtime.busyWorkers.has(workerId))continue;
   const worker=this.actors.find(a=>a.id===workerId);if(!worker)continue;
   const goal=this.interior?route.interiorPoint:route.point;
   const path=worker.nav.path([worker.x,worker.y],goal);
   if(!path.length){this.runtime.completed.add(task);props.onTaskError(task,'No hay una ruta transitable hacia esta tarea.');continue;}
   worker.route=path;worker.sleeping=false;worker.state='WALK';
   this.runtime.busyWorkers.set(workerId,task);
   this.jobs.set(workerId,{task,worker,phase:'walk',until:0,effect:null});
  }
  for(const actor of this.actors){
   const job=this.jobs.get(actor.id);
   const sharedTask=this.runtime.busyWorkers.get(actor.id),elsewhere=sharedTask&&this.runtime.owners.get(sharedTask)!==this.sys.settings.key;
   actor.shadow.setVisible(!elsewhere);if(elsewhere){actor.sprite.setVisible(false);actor.accessory?.setVisible(false);continue;}
   if(job?.phase==='action'){actor.state='WORK';
    actor.sprite.setFlipX(job.task==='collect-milk').setFrame(actor.row*4+3).setY(actor.y+Math.sin(time/180)*.6);
    if(time>=job.until){job.effect?.destroy();this.jobs.delete(actor.id);this.runtime.busyWorkers.delete(actor.id);this.runtime.completed.add(job.task);this.runtime.props.current.onTaskComplete(job.task);actor.route=actor.nav.path([actor.x,actor.y],actor.home);actor.nextPatrol=time+6500;}
    continue;
   }
   if(actor.route.length){if(!['RUN','FOLLOW'].includes(actor.state))actor.state='WALK';
    const target=actor.route[0],dx=target[0]-actor.x,dy=target[1]-actor.y,distance=Math.hypot(dx,dy);
    const speed=(actor.kind==='worker'?95:actor.kind==='cow'?10:actor.kind==='dog'?actor.state==='RUN'?80:55:actor.eventTarget?45:24)*(this.interior?1.5:1),move=Math.min(distance,speed*delta/1000);
    const x=actor.x+dx/Math.max(distance,.001)*move,y=actor.y+dy/Math.max(distance,.001)*move;
    if(!actor.nav.gatesReady(x,y))continue;
    if(!actor.nav.canWalk(x,y)){actor.route=[];if(job){this.jobs.delete(actor.id);this.runtime.busyWorkers.delete(actor.id);this.runtime.completed.add(job.task);this.runtime.props.current.onTaskError(job.task,'La ruta se detuvo antes de un obstáculo.');}continue;}
    actor.x=x;actor.y=y;actor.sprite.setFlipX(actor.kind==='cow'||actor.kind==='dog'?dx>0:dx<0);
    actor.sprite.setFrame(actor.kind==='cow'?0:actor.kind==='worker'||actor.kind==='dog'?actor.row*4+1+Math.floor(time/(actor.state==='RUN'?95:160))%2:1+Math.floor(time/(actor.state==='RUN'?95:160))%2);
    actor.sprite.setPosition(x,y-Math.abs(Math.sin(time/100))*(actor.kind==='cow'?.4:.8)).setDepth(y);
    actor.shadow.setPosition(x,y).setDepth(y-.1);
    if(distance<=move+.2)actor.route.shift();
   }else if(job){
    actor.state='WORK';job.phase='action';job.until=time+taskRoutes[job.task].duration;job.effect=this.taskEffect(job);
   }else{
    if(actor.eventTarget){actor.state=actor.kind==='worker'?'CELEBRATE':actor.kind==='chick'?actor.variant===6?'LOOK_UP':'DANCE':'SIT';}else if(actor.kind==='chick')actor.state=actor.variant===5?'DANCE':actor.variant===6?'LOOK_UP':'IDLE';
    if(actor.kind==='worker'&&!actor.eventTarget)actor.state=actor.step%3===0?'WORK':actor.step%3===1?'OBSERVE':'IDLE';
    if(actor.kind==='dog'&&!actor.eventTarget)actor.state=(['IDLE','SIT','SLEEP','OBSERVE'][actor.step%4] as Actor['state']);
    actor.sprite.setPosition(actor.x,actor.y+Math.sin(time/(actor.kind==='cow'?1100:650))*.3).setFrame(actor.kind==='cow'?(Math.floor(time/7000)%2):actor.kind==='worker'?actor.row*4+(actor.state==='WORK'?3:0):actor.kind==='dog'?actor.row*4+(['SIT','SLEEP'].includes(actor.state)?3:0):actor.sleeping?3:Math.floor(time/2900)%3===0?3:0);
    if(time>actor.nextPatrol&&!actor.sleeping&&!actor.eventTarget&&actor.patrol.length){let target=actor.patrol[actor.step++%actor.patrol.length];if(actor.kind==='dog'&&actor.step%3===0){const human=this.actors.filter(a=>a.kind===((actor.step%6===0)?'chick':'worker'))[Math.floor(actor.step/3)%3];if(human){const near:Point=[human.x+(actor.row?-18:18),human.y+(actor.row?18:12)];if(actor.nav.canWalk(...near))target=near;actor.state='FOLLOW';}}else if(actor.kind==='dog')actor.state=actor.step%2?'RUN':'WALK';actor.route=actor.nav.path([actor.x,actor.y],target);if(actor.kind!=='dog')actor.state=actor.step%3?'OBSERVE':'IDLE';actor.nextPatrol=time+4500+(actor.step%4)*1800;}
   }
   if((actor.eventTarget||actor.state==='DANCE')&&!actor.route.length){actor.sprite.y-=actor.kind==='dog'?0:Math.max(0,Math.sin(time/140+actor.row))*3;actor.sprite.setFrame(actor.kind==='dog'?actor.row*4+3:actor.kind==='worker'?actor.row*4+3:actor.variant===4?0:3);}
   // Helmet and hammer belong to the complete character frames, never an overlay.
   if(actor.workerChick){const frame=actor.route.length?1+Math.floor(time/160)%2:actor.eventTarget?7:actor.step%3===0?3+Math.floor(time/220)%3:actor.step%3===1?6:0;actor.sprite.setFrame(frame);}
   if(actor.kind==='dog'&&actor.accessory){const g=actor.accessory;g.clear();if(actor.state==='SLEEP'){g.lineStyle(1,0xfff4dc,.85);g.beginPath();g.moveTo(7,-29).lineTo(12,-29).lineTo(7,-24).lineTo(12,-24);g.strokePath();}}
   actor.accessory?.setPosition(actor.x,actor.sprite.y).setDepth(actor.y+.2).setVisible(actor.sprite.visible);
   actor.sprite.setVisible(this.cameras.main.worldView.contains(actor.x,actor.y)||!this.scene.isVisible());
  }
 }
 protected taskEffect(job:Job):Phaser.GameObjects.Container {
  const a=job.worker,container=this.add.container(a.x+(job.task==='collect-milk'?-16:15),a.y).setDepth(a.y+1),g=this.add.graphics();container.add(g);
  if(job.task==='collect-milk'){
   // Pixel bucket and animated streams beside the kneeling worker.
   g.fillStyle(0x385765).fillRect(-9,-11,18,15);g.fillStyle(0xb9d2d0).fillRect(-7,-10,14,12);g.fillStyle(0xfff8d8).fillRect(-6,-9,12,4);
   this.tweens.add({targets:container,y:container.y-.8,duration:220,yoyo:true,repeat:-1});
   this.actors.filter(actor=>actor.kind==='cow').forEach(cow=>{cow.route=[];cow.nextPatrol=this.time.now+6000;});
  }else if(job.task==='feed-chickens'){
   g.fillStyle(0xe8c27c);for(let i=0;i<16;i++)g.fillRect((i*17)%30-15,(i*11)%14,2,2);
   this.actors.filter(actor=>actor.kind==='chick').slice(0,7).forEach((chick,i)=>{const target:Point=[a.x+20+(i%3)*9,a.y+7+Math.floor(i/3)*8];if(chick.nav.canWalk(...target)){chick.route=chick.nav.path([chick.x,chick.y],target);chick.nextPatrol=this.time.now+8000;}});
  }else if(job.task==='collect-eggs'){
   g.fillStyle(0xb68041).fillRect(-8,-7,19,12);g.fillStyle(0xffedbb);for(let i=0;i<3;i++)g.fillRect(-5+i*5,-11,4,6);
  }else{
   g.fillStyle(job.task==='feed-cows'?0xdaba6c:0x9cddec,.8);for(let i=0;i<8;i++)g.fillRect((i*7)%25-12,(i*13)%12-12,2,3);
   this.tweens.add({targets:container,alpha:.35,duration:330,yoyo:true,repeat:-1});
  }
  return container;
 }
}
