import Phaser from 'phaser';
import type { Point } from '../navigation';
import type { WorldScene,Actor } from '../WorldScene';
import { gatheringPoints, celebrationHumans } from '../../data/celebration';
import { FireworksSystem } from '../effects/FireworksSystem';
export class CelebrationEvent {
 phase:'idle'|'gathering'|'show'|'restoring'='idle';private members:Actor[]=[];private planned=new Set<string>();private originals=new Map<string,{sleeping:boolean|undefined;nextPatrol:number}>();
 private fireworks:FireworksSystem;private dim:Phaser.GameObjects.Rectangle;private lights:Phaser.GameObjects.Graphics;private sky:Phaser.GameObjects.Graphics;private cameraSaved?:{x:number;y:number;zoom:number};private cinematic=false;private audio?:AudioContext;private lastPlan=0;
 constructor(private scene:WorldScene,private world={width:1672,height:940},private anchor:Point=[805,415]){
  const offset:Point=[anchor[0]-805,anchor[1]-415];
  this.fireworks=new FireworksSystem(scene,offset);this.dim=scene.add.rectangle(world.width/2,world.height/2,world.width,world.height,0x11152f,0).setDepth(4000);this.sky=scene.add.graphics().setPosition(...offset).setDepth(4002).setAlpha(0);for(let y=0;y<330;y+=8){this.sky.fillStyle(0x101329,.65*(1-y/330)).fillRect(0,y,1672,8);}
  this.lights=scene.add.graphics().setPosition(...offset).setDepth(4001).setBlendMode(Phaser.BlendModes.ADD);
  const begin=()=>{if(scene.input.enabled)this.start();};window.addEventListener('farm-surprise',begin);scene.events.once('shutdown',()=>{window.removeEventListener('farm-surprise',begin);void this.audio?.close();});
 }
 private status(phase:CelebrationEvent['phase']){this.phase=phase;window.dispatchEvent(new CustomEvent('farm-celebration-status',{detail:phase}));}
 start(){
  if(this.phase!=='idle')return;this.status('gathering');this.planned.clear();this.originals.clear();this.cinematic=false;
  this.members=this.scene.actors.filter(a=>a.kind==='worker'||a.kind==='dog'||a.id.startsWith('celebration-chick')||a.kind==='chick'&&Math.hypot(a.x-this.anchor[0],a.y-this.anchor[1])<300);
  this.members.forEach(a=>this.originals.set(a.id,{sleeping:a.sleeping,nextPatrol:a.nextPatrol}));
  // Audio is opened only by the user's activation; unsupported/blocked audio is optional.
  try{this.audio??=new AudioContext();void this.audio.resume();}catch{/* silent celebration */}
 }
 update(time:number,delta:number){
  if(this.phase==='idle')return;
  if(this.phase==='gathering'){
   // One route per frame avoids an A* spike when the whole farm gathers.
   if(time-this.lastPlan>60){const a=this.members.find(a=>!this.scene.isBusy(a.id)&&!this.planned.has(a.id));if(a){const index=this.members.indexOf(a),point=celebrationHumans[a.id]??gatheringPoints[index%gatheringPoints.length];const path=a.nav.path([a.x,a.y],point);if(path.length){a.eventTarget=point;a.sleeping=false;a.route=path;this.planned.add(a.id);}else{this.members=this.members.filter(m=>m!==a);}}this.lastPlan=time;}
   // New jobs retain priority and are never lost. Rejoin after finishing.
   for(const a of this.members)if(this.scene.isBusy(a.id))this.planned.delete(a.id);
   if(this.members.length&&this.members.every(a=>this.planned.has(a.id)&&!a.route.length&&!this.scene.isBusy(a.id))){this.beginShow();}
   return;
  }
  if(this.phase==='show'){
   this.fireworks.update(delta);this.lights.clear();for(const [x,y] of [[675,365],[945,366],[805,300],[695,320],[908,317]]){this.lights.fillStyle(0xffcf70,.07+Math.sin(time/150)*.01).fillCircle(x,y,38);this.lights.fillStyle(0xffdfa1,.2).fillCircle(x,y,10);}
   if(this.fireworks.textForming&&!this.cinematic){this.cinematic=true;this.scene.tweens.add({targets:this.sky,alpha:1,duration:1000});const camera=this.scene.cameras.main;this.cameraSaved={x:camera.midPoint.x,y:camera.midPoint.y,zoom:camera.zoom};camera.pan(this.anchor[0],this.anchor[1]-95,1400,'Sine.easeInOut');camera.zoomTo(Math.max(Math.max(this.scene.scale.width/this.world.width,this.scene.scale.height/this.world.height),Math.min(camera.zoom*.9,this.scene.scale.width/520)),1400,'Sine.easeInOut');}
   if(this.fireworks.finished){this.status('restoring');this.fireworks.clear();this.scene.tweens.add({targets:this.sky,alpha:0,duration:1400});this.scene.tweens.add({targets:this.dim,fillAlpha:0,duration:1600});if(this.cameraSaved){const c=this.scene.cameras.main;c.pan(this.cameraSaved.x,this.cameraSaved.y,1400,'Sine.easeInOut');c.zoomTo(this.cameraSaved.zoom,1400,'Sine.easeInOut');}this.scene.time.delayedCall(1700,()=>this.finish());}
  }
 }
 private beginShow(){this.status('show');this.scene.tweens.add({targets:this.dim,fillAlpha:.42,duration:1800});this.fireworks.start();this.music();}
 private music(){const ctx=this.audio;if(!ctx||ctx.state!=='running')return;[523,659,784,659,698,880,784,1046].forEach((frequency,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=frequency;g.gain.setValueAtTime(0,ctx.currentTime+i*.38);g.gain.linearRampToValueAtTime(.022,ctx.currentTime+i*.38+.04);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+i*.38+.7);o.connect(g);g.connect(ctx.destination);o.start(ctx.currentTime+i*.38);o.stop(ctx.currentTime+i*.38+.75);});}
 private finish(){this.lights.clear();for(const a of this.members){a.eventTarget=undefined;const original=this.originals.get(a.id);a.sleeping=original?.sleeping;a.state=a.sleeping?'SLEEP':'IDLE';a.nextPatrol=this.scene.time.now+2000;}this.members=[];this.status('idle');}
 get stage(){return this.phase==='show'?(this.fireworks.messageReady?'message':this.fireworks.textForming?'text':'fireworks'):this.phase;}
 get particles(){return this.fireworks.engine.particles.length;}
}
