import Phaser from 'phaser';
import { NavigationGrid, type Point } from './navigation';
import { workers, taskRoutes } from '../data/routes';
import type { FarmRuntime } from './types';
import type { TaskId } from '../domain';
import type { CameraControls } from './camera';
export interface Actor {
 id:string; kind:'chick'|'worker'|'cow'; row:number; x:number; y:number; home:Point; patrol:Point[]; route:Point[]; step:number;
 sprite:Phaser.GameObjects.Sprite; shadow:Phaser.GameObjects.Ellipse; nav:NavigationGrid; nextPatrol:number; sleeping?:boolean;
}
interface Job {task:TaskId;worker:Actor;phase:'walk'|'action';until:number;effect:Phaser.GameObjects.Container|null;}
export abstract class WorldScene extends Phaser.Scene {
 actors:Actor[]=[]; controls!:CameraControls; nav!:NavigationGrid;
 protected jobs=new Map<string,Job>(); protected interior=false;
 constructor(key:string,protected runtime:FarmRuntime){super(key);}
 protected actor(id:string,kind:Actor['kind'],point:Point,patrol:Point[],nav:NavigationGrid,row=0,sleeping=false):Actor {
  const initial=nav.nearest(point),factor=this.interior?2:1;
  const shadow=this.add.ellipse(initial[0],initial[1],(kind==='cow'?49:kind==='worker'?17:13)*factor,(kind==='cow'?13:5)*factor,0x543b26,.28).setDepth(initial[1]-.1);
  const sprite=this.add.sprite(...initial,kind==='cow'?'cows':'actors',kind==='worker'?row*4:0)
   .setDisplaySize((kind==='cow'?80:kind==='worker'?46:34)*factor,(kind==='cow'?80:kind==='worker'?46:34)*factor)
   .setOrigin(.5,kind==='chick'?.79:kind==='cow'?.82:.96).setDepth(initial[1]);
  sprite.setInteractive({useHandCursor:true});sprite.on('pointerup',()=>{if(!this.controls.moved)this.runtime.props.current.onSelect(id);});
  const actor:Actor={id,kind,row,x:initial[0],y:initial[1],home:initial,patrol,route:[],step:0,sprite,shadow,nav,nextPatrol:1000+this.actors.length*370,sleeping};this.actors.push(actor);return actor;
 }
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
   worker.route=path;worker.sleeping=false;
   this.runtime.busyWorkers.set(workerId,task);
   this.jobs.set(workerId,{task,worker,phase:'walk',until:0,effect:null});
  }
  for(const actor of this.actors){
   const job=this.jobs.get(actor.id);
   const sharedTask=this.runtime.busyWorkers.get(actor.id),elsewhere=sharedTask&&this.runtime.owners.get(sharedTask)!==this.sys.settings.key;
   actor.shadow.setVisible(!elsewhere);if(elsewhere){actor.sprite.setVisible(false);continue;}
   if(job?.phase==='action'){
    actor.sprite.setFlipX(job.task==='collect-milk').setFrame(actor.row*4+3).setY(actor.y+Math.sin(time/180)*.6);
    if(time>=job.until){job.effect?.destroy();this.jobs.delete(actor.id);this.runtime.busyWorkers.delete(actor.id);this.runtime.completed.add(job.task);this.runtime.props.current.onTaskComplete(job.task);actor.route=actor.nav.path([actor.x,actor.y],actor.home);actor.nextPatrol=time+6500;}
    continue;
   }
   if(actor.route.length){
    const target=actor.route[0],dx=target[0]-actor.x,dy=target[1]-actor.y,distance=Math.hypot(dx,dy);
    const speed=(actor.kind==='worker'?95:actor.kind==='cow'?10:24)*(this.interior?1.5:1),move=Math.min(distance,speed*delta/1000);
    const x=actor.x+dx/Math.max(distance,.001)*move,y=actor.y+dy/Math.max(distance,.001)*move;
    if(!actor.nav.canWalk(x,y)){actor.route=[];if(job){this.jobs.delete(actor.id);this.runtime.busyWorkers.delete(actor.id);this.runtime.completed.add(job.task);this.runtime.props.current.onTaskError(job.task,'La ruta se detuvo antes de un obstáculo.');}continue;}
    actor.x=x;actor.y=y;actor.sprite.setFlipX(actor.kind==='cow'?dx>0:dx<0);
    actor.sprite.setFrame(actor.kind==='cow'?0:actor.kind==='worker'?actor.row*4+1+Math.floor(time/160)%2:1+Math.floor(time/160)%2);
    actor.sprite.setPosition(x,y-Math.abs(Math.sin(time/100))*(actor.kind==='cow'?.4:.8)).setDepth(y);
    actor.shadow.setPosition(x,y).setDepth(y-.1);
    if(distance<=move+.2)actor.route.shift();
   }else if(job){
    job.phase='action';job.until=time+taskRoutes[job.task].duration;job.effect=this.taskEffect(job);
   }else{
    actor.sprite.setPosition(actor.x,actor.y+Math.sin(time/(actor.kind==='cow'?1100:650))*.3).setFrame(actor.kind==='cow'?(Math.floor(time/7000)%2):actor.kind==='worker'?actor.row*4:actor.sleeping?3:Math.floor(time/2900)%3===0?3:0);
    if(time>actor.nextPatrol&&!actor.sleeping&&actor.patrol.length){const target=actor.patrol[actor.step++%actor.patrol.length];actor.route=actor.nav.path([actor.x,actor.y],target);actor.nextPatrol=time+3000+(actor.step%4)*1400;}
   }
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
