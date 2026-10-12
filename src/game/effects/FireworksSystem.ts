import Phaser from 'phaser';
import { ParticleEngine,fireworkColors,type BurstKind } from './particles';
import { ParticleTextSystem } from './ParticleTextSystem';
interface Rocket {x:number;y:number;sx:number;sy:number;tx:number;ty:number;age:number;duration:number;kind:BurstKind;color:number;}
export class FireworksSystem {
 readonly engine:ParticleEngine;private rockets:Rocket[]=[];private graphics:Phaser.GameObjects.Graphics;private glow:Phaser.GameObjects.Graphics;
 private launchTimer=0;private launched=0;private elapsed=0;private firstText=false;private secondText=false;private finale=false;private mobile:boolean;private slow=0;
 constructor(scene:Phaser.Scene){this.mobile=scene.scale.width/Math.min(window.devicePixelRatio||1,2)<760;this.engine=new ParticleEngine(this.mobile?650:1600);this.glow=scene.add.graphics().setDepth(4900).setBlendMode(Phaser.BlendModes.ADD);this.graphics=scene.add.graphics().setDepth(4901);}
 start(){this.elapsed=0;this.launchTimer=0;this.launched=0;this.firstText=this.secondText=this.finale=false;this.engine.reset();this.rockets=[];}
 update(delta:number){
  const dt=Math.min(delta/1000,.05);this.elapsed+=dt;this.launchTimer-=dt;
  if(delta>25)this.slow++;else this.slow=Math.max(0,this.slow-1);
  if(this.slow>50&&!this.firstText){this.engine.limit=Math.max(this.mobile?420:900,this.engine.limit-100);this.slow=0;}
  if(this.elapsed<8&&this.launchTimer<=0){this.launchTimer=.65;this.launch();}
  for(const rocket of this.rockets){rocket.age+=dt;const t=Math.min(1,rocket.age/rocket.duration);rocket.x=rocket.sx+(rocket.tx-rocket.sx)*t+Math.sin(t*Math.PI)*18;rocket.y=rocket.sy+(rocket.ty-rocket.sy)*t;
   this.engine.add({x:rocket.x,y:rocket.y,vx:(Math.random()-.5)*8,vy:15,age:0,life:.55,color:rocket.color,size:1.5,gravity:10});
   if(t===1)this.engine.burst(rocket.x,rocket.y,rocket.kind,rocket.color,this.mobile?65:130);
  }
  this.rockets=this.rockets.filter(r=>r.age<r.duration);
  if(this.elapsed>=8&&!this.firstText){this.firstText=true;this.engine.particles=this.engine.particles.filter(p=>p.target);this.engine.text(ParticleTextSystem.sample('ORGULLOSOS DE TI',[805,187],Math.floor(this.engine.limit*.52)),[805,300]);}
  if(this.elapsed>=10&&!this.secondText){this.secondText=true;this.engine.particles=this.engine.particles.filter(p=>p.target);this.engine.text(ParticleTextSystem.sample('POLLITO',[805,245],Math.floor(this.engine.limit*.28)),[805,340]);}
  if(this.elapsed>=17&&!this.finale){this.finale=true;this.engine.reset();this.engine.burst(805,213,'chrysanthemum',0xffd277,this.mobile?150:300);for(let i=0;i<4;i++)this.engine.burst(650+i*100,260,'heart',0xff91b5,this.mobile?40:80);}
  this.engine.update(dt);this.draw();
 }
 private launch(){const i=this.launched++;this.rockets.push({x:0,y:0,sx:720+i%3*80,sy:440,tx:630+i%5*90,ty:100+i%3*45,age:0,duration:1.1+Math.random()*.5,kind:(['burst','willow','chrysanthemum','heart','sparkles'] as BurstKind[])[i%5],color:fireworkColors[i%5]});}
 private draw(){this.graphics.clear();this.glow.clear();for(const p of this.engine.particles){const alpha=Math.min(1,(p.life-p.age)/(p.target?1.2:.7))*(p.target?(.8+Math.sin(p.age*9+(p.phase??0))*.2)*Math.max(0,Math.min(1,17-this.elapsed)):1);this.glow.fillStyle(p.color,alpha*(p.target?.035:.12)).fillCircle(p.x,p.y,p.size*(p.target?2:3));this.graphics.fillStyle(p.color,alpha).fillRect(Math.round(p.x),Math.round(p.y),p.size,p.size);}for(const r of this.rockets){this.glow.fillStyle(r.color,.35).fillCircle(r.x,r.y,4);this.graphics.fillStyle(0xfff8dd).fillRect(r.x,r.y,2,4);}}
 get messageReady(){return this.elapsed>=12.4&&this.elapsed<16.7;}
 get textForming(){return this.elapsed>=8&&this.elapsed<17;}
 get finished(){return this.elapsed>=21;}
 clear(){this.engine.reset();this.rockets=[];this.graphics.clear();this.glow.clear();}
}
