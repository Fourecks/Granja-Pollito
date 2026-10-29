import Phaser from 'phaser';
import type { NavigationGrid } from '../navigation';
import { LivestockSimulation, livestockHabitats, type Species } from './livestock';

/** Eight grounded poses per coat, drawn once at native pixel resolution. */
function animalTexture(scene:Phaser.Scene,species:Species,variant:number,frame:number){
 const key=`livestock-${species}-${variant}-${frame}`;if(scene.textures.exists(key))return key;
 const c=document.createElement('canvas');c.width=64;c.height=48;const g=c.getContext('2d')!;
 const r=(color:string,x:number,y:number,w:number,h:number)=>{g.fillStyle=color;g.fillRect(Math.round(x),Math.round(y),w,h);};
 // Rasterise rounded anatomy into hard pixel clusters, without antialiasing.
 const oval=(color:string,cx:number,cy:number,rx:number,ry:number)=>{for(let y=-ry;y<=ry;y++)for(let x=-rx;x<=rx;x++)if(x*x/(rx*rx)+y*y/(ry*ry)<=1)r(color,cx+x,cy+y,1,1);};
 const eating=frame>=6,walk=frame<4,step=walk?[0,2,0,-2][frame]:0,breath=frame===5?1:0;
 const hoof='#554538',outline='#554b3a',cream='#f4e4bd';
 if(species==='chicken'){
  const dip=eating?12+frame%2*2:0,bob=walk?Math.abs(step):breath;
  r('#b47a2d',26-step,39,2,5);r('#d49b38',35+step,39,2,5);r('#e9b650',25-step,43,5,1);r('#e9b650',34+step,43,5,1);
  oval('#b88d35',30,32-bob,15,10);oval('#efc551',30,30-bob,15,10);oval('#ffe18a',31,27-bob,12,7);
  r('#e8ba48',14,27-bob,6,5);r('#ffdf7c',14,26-bob,4,2);
  oval('#cc9f38',29,33-bob,7,5);oval('#f2cf65',28,31-bob,7,4);r('#ffe997',24,30-bob,6,1);
  oval('#e5b94a',42,23+dip-bob,9,9);oval('#ffe18a',42,21+dip-bob,8,7);
  r('#f7ce64',37,15+dip-bob,8,2);r('#493c2c',46,21+dip-bob,2,3);r('#fff6cf',46,21+dip-bob,1,1);
  r('#d58b2b',50,25+dip-bob,5,3);r('#f7b549',51,25+dip-bob,4,1);
  if(variant===2){r('#b84a32',39,12+dip-bob,3,5);r('#d7683c',43,13+dip-bob,3,4);}
 }else if(species==='rabbit'){
  const dip=eating?7+frame%2*2:0,hop=walk?Math.abs(step):0;
  const fur=[['#c6b89d','#e8dcc1','#9d8e77'],['#a68d74','#d1b89a','#7e6a58'],['#e0dbce','#fff0d8','#aaa699']][variant];
  oval(fur[2],30,34-hop,17,9);oval(fur[0],29,30-hop,17,11);oval(fur[1],25,26-hop,11,7);
  oval(fur[1],12,31-hop,4,4);oval(fur[2],25-step,41,6,2);oval(fur[1],25-step,40,6,2);oval(fur[1],43+step,41,5,2);
  oval(fur[0],43,28+dip-hop,9,8);oval(fur[1],43,26+dip-hop,8,6);
  oval(fur[0],39,14+dip-hop,3,10);oval(fur[1],45,12+dip-hop,3,10);r('#c99284',39,8+dip-hop,1,9);r('#dba899',45,6+dip-hop,1,10);
  r('#3e3c35',47,25+dip-hop,2,3);r('#fff7db',47,25+dip-hop,1,1);r('#cb9084',51,29+dip-hop,2,2);
  r(fur[2],51,32+dip-hop,5,1);
 }else{
  const horse=species==='horse',cow=species==='cow',pig=species==='pig',goat=species==='goat';
  const palette=horse?[['#95603c','#bd8753','#694631'],['#ad8055','#d1aa77','#79593b'],['#695344','#967a60','#473c35']][variant]:cow?[['#e2d6b9','#fff0ce','#b4a68e'],['#c69e6a','#e8c995','#937246'],['#c9b99d','#ede0bf','#978c78']][variant]:pig?[['#d69583','#f1b8a1','#a96e65'],['#c78578','#e9aa99','#975d58'],['#d6b1a0','#efcdbc','#af8778']][variant]:[['#c8b995','#ece1bf','#9c8d71'],['#a88e68','#d0b68a','#7b684f'],['#d4cebc','#eee9d3','#a19d90']][variant];
  const [base,lit,dark]=palette,legTop=horse?29:32,legLength=horse?13:pig?7:10;
  for(const [x,s] of [[20,-1],[43,1]] as const){r(dark,x-step*s,legTop,4,legLength);r(hoof,x-step*s,legTop+legLength-2,5,2);}
  oval(dark,29,26+breath,21,pig?12:10);oval(base,29,24+breath,21,pig?12:10);oval(lit,27,20+breath,17,6);
  if(cow){oval('#605b49',19,22,6,6);oval('#605b49',32,27,5,5);oval('#746b55',39,20,4,4);r('#b38a77',30,36,7,3);}
  if(goat){r(dark,17,20,2,8);r(lit,20,18,9,1);}
  const nearStep=-step;for(const x of [17,40]){r(base,x+nearStep,31,4,legLength);r(lit,x+nearStep,32,2,legLength-3);r(hoof,x+nearStep,31+legLength-2,5,2);}
  const tailY=horse?23:25;r(dark,7,tailY,3,horse?14:7);r(horse?'#493b2d':base,5+(frame%2),tailY+3,3,horse?12:4);
  const hx=eating?48:47,hy=eating?(horse?33+frame%2:34+frame%2):horse?16:24;
  if(horse){oval(dark,43,eating?25:19,6,10);oval(base,44,eating?25:18,6,10);r('#57412d',39,eating?19:9,3,13);}
  oval(dark,hx,hy+1,9,pig?8:7);oval(base,hx,hy,9,pig?8:7);oval(lit,hx-1,hy-3,7,4);
  if(horse){r(base,hx-5,hy-13,3,9);r(dark,hx,hy-14,3,8);r(lit,hx-5,hy-13,2,3);r(cream,hx+1,hy-4,3,7);}
  else {oval(dark,hx-8,hy-5,4,3);oval(base,hx-8,hy-6,4,3);oval(base,hx+5,hy-7,4,3);r(pig?'#b77d73':lit,hx-10,hy-7,3,2);}
  if(cow||goat){r('#b9b493',hx-6,hy-10,2,5);r(cream,hx-7,hy-12,2,4);r('#c4be9d',hx+3,hy-11,2,4);}
  const muzzle=pig?'#e7a491':cow?'#bd9984':dark;oval(muzzle,hx+6,hy+4,pig?6:5,4);r(pig?'#aa6c62':outline,hx+7,hy+4,1,2);
  if(pig)r('#a8655d',hx+3,hy+4,1,2);
  if(goat)r(cream,hx+3,hy+8,2,4);
  r('#302f28',hx+2,hy-2,2,2);r('#fff5d7',hx+2,hy-2,1,1);
 }
 scene.textures.addCanvas(key,c);return key;
}
export class LivestockLayer {
 readonly simulation:LivestockSimulation;private objects:Array<{image:Phaser.GameObjects.Image;shadow:Phaser.GameObjects.Ellipse;frame:number}>=[];
 private nibble:Phaser.GameObjects.Graphics;private lastEffects=0;
 constructor(private scene:Phaser.Scene,nav:NavigationGrid){
  this.simulation=new LivestockSimulation(nav.forGateAccess(false));this.nibble=scene.add.graphics();
  for(const a of this.simulation.animals){
   for(let f=0;f<8;f++)animalTexture(scene,a.habitat.species,a.variant,f);
   const shadow=scene.add.ellipse(a.x,a.y,a.habitat.size*.66,a.habitat.size*.18,0x3d3727,.2);
   const image=scene.add.image(a.x,a.y,`livestock-${a.habitat.species}-${a.variant}-4`).setOrigin(.5,44/48).setScale(a.habitat.size/54).setData('animal',{id:a.id,species:a.habitat.species,home:a.habitat.home});
   this.objects.push({image,shadow,frame:4});
  }
 }
 update(time:number,delta:number){
  this.simulation.update(time,delta);const view=this.scene.cameras.main.worldView,drawEffects=time-this.lastEffects>100;
  if(drawEffects){this.lastEffects=time;this.nibble.clear();}
  this.simulation.animals.forEach((a,i)=>{
   const o=this.objects[i],visible=view.contains(a.x,a.y)||Phaser.Geom.Rectangle.Contains(view,a.x,a.y-50);
   o.image.setVisible(visible);o.shadow.setVisible(visible);if(!visible)return;
   const frame=a.state==='walk'?Math.floor(time/155+a.phase)%4:a.state==='eat'?6+Math.floor(time/260+a.phase)%2:4+Math.floor(time/800+a.phase)%2;
   if(frame!==o.frame){o.frame=frame;o.image.setTexture(`livestock-${a.habitat.species}-${a.variant}-${frame}`);}
   o.image.setPosition(Math.round(a.x),Math.round(a.y)).setFlipX(a.facing<0).setDepth(a.y);
   o.shadow.setPosition(a.x,a.y).setDepth(a.y-.2);
   if(drawEffects&&a.state==='eat'){
    const x=Math.round(a.x+a.facing*a.habitat.size*.35),y=Math.round(a.y-1);
    this.nibble.fillStyle(0x799141,.8).fillRect(x,y,3,2).fillStyle(0xb8b568,.75).fillRect(x+a.facing*3,y-(frame%2?3:1),2,2);
   }
  });this.nibble.setDepth(3000);
 }
 get diagnostics(){return {count:this.simulation.animals.length,species:livestockHabitats.map(h=>({id:h.species,count:this.simulation.animals.filter(a=>a.habitat===h).length,home:h.home})),animals:this.simulation.animals.map(a=>({id:a.id,x:Math.round(a.x),y:Math.round(a.y),state:a.state}))};}
}
