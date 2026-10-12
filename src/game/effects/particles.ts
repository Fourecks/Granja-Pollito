export type BurstKind='burst'|'willow'|'chrysanthemum'|'heart'|'sparkles';
export const fireworkColors=[0xffd277,0xff91b5,0x91d6ff,0xfff9e7,0xffea73];
export interface Particle {x:number;y:number;vx:number;vy:number;age:number;life:number;color:number;size:number;gravity:number;target?:readonly[number,number];origin?:readonly[number,number];phase?:number;}
export class ParticleEngine {
 particles:Particle[]=[];
 constructor(public limit:number,private random=()=>Math.random()){}
 add(p:Particle){if(this.particles.length<this.limit)this.particles.push(p);}
 burst(x:number,y:number,kind:BurstKind,color:number,count=95){
  for(let i=0;i<count;i++){
   const angle=i/count*Math.PI*2,r=kind==='chrysanthemum'?90:30+this.random()*85;
   const hx=16*Math.sin(angle)**3,hy=-(13*Math.cos(angle)-5*Math.cos(2*angle)-2*Math.cos(3*angle)-Math.cos(4*angle));
   this.add({x,y,vx:kind==='heart'?hx*6:Math.cos(angle)*r,vy:kind==='heart'?hy*6:Math.sin(angle)*r,age:0,life:kind==='willow'?3.8:kind==='sparkles'?1.6:2.8,color,size:kind==='sparkles'?1:1.7,gravity:kind==='willow'?30:18});
  }
 }
 text(points:readonly(readonly[number,number])[],origin:readonly[number,number]){
  for(const target of points)this.add({x:origin[0]+(this.random()-.5)*250,y:origin[1]+(this.random()-.5)*80,vx:0,vy:0,age:0,life:10,color:0xfff2bc,size:3.3,gravity:0,target,phase:this.random()*6});
  for(const p of this.particles)if(p.target&&!p.origin)p.origin=[p.x,p.y];
 }
 update(delta:number){
  const dt=Math.min(delta,.05);
  for(const p of this.particles){p.age+=dt;if(p.target){const t=Math.min(1,p.age/2.2),ease=1-(1-t)**3;p.x=p.origin![0]+(p.target[0]-p.origin![0])*ease+Math.sin(p.age*2+p.phase!)*.35;p.y=p.origin![1]+(p.target[1]-p.origin![1])*ease+Math.cos(p.age*2+p.phase!)*.35;}
   else{p.vx*=Math.exp(-dt*.35);p.vy+=p.gravity*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}}
  this.particles=this.particles.filter(p=>p.age<p.life);
 }
 reset(){this.particles=[];}
}
