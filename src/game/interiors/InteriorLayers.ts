import Phaser from 'phaser';
import { rectangle, type Polygon } from '../navigation';
import { advanceGate, type RuralGate, type GateActor } from '../world/ruralGates';
import type { InteriorId } from '../../data/world';
import type { TaskId } from '../../domain';

/** Each physical surface is an independent display object, not a room-sized illustration. */
export class InteriorLayers {
 readonly walkable=[rectangle(125,320,1420,490)];
 readonly obstacles:Polygon[]=[];
 readonly gates:RuralGate[]=[];
 private water:Phaser.GameObjects.Graphics;
 private gateArt:Phaser.GameObjects.Graphics[]=[];
 private pinned=new Set<string>();
 private straw:Phaser.GameObjects.Graphics[]=[];
 private feed:Phaser.GameObjects.Graphics[]=[];
 private feeding=false;
 private wet=false;
 private lastFrame=-1;
 constructor(private scene:Phaser.Scene,private id:InteriorId,canInteract:()=>boolean,onTask:(id:TaskId)=>void=()=>{}){
  const g=scene.add.graphics().setDepth(-20);
  g.fillStyle(0x18251e).fillRect(0,0,1672,941);
  g.fillStyle(0x352c23).fillRect(98,290,1476,550);
  for(let y=320;y<820;y+=24)for(let x=112;x<1556;x+=96){
   const offset=(Math.floor(y/24)%2)*48,xx=x-offset;
   const colors=id==='pig-shelter'?[0x99764c,0xa27c50,0x937048]:[0xa77c49,0xb08650,0xa17a48,0xb78b53];
   g.fillStyle(colors[(x/96+Math.floor(y/24))%colors.length|0]).fillRect(xx,y,94,22);
   g.fillStyle(0xc39b61,.4).fillRect(xx+4,y+2,78,2);
   g.fillStyle(0x725134,.45).fillRect(xx+18,y+14,38,2);
  }
  // Back wall: individual boards, stone footing, beams and translucent windows.
  const wall=scene.add.graphics().setDepth(300);
  wall.fillStyle(0x4b3425).fillRect(98,115,1476,205);
  for(let x=112;x<1560;x+=32){wall.fillStyle(x%64?0x805737:0x8e603b).fillRect(x,125,29,175);wall.fillStyle(0xb48046,.5).fillRect(x+3,128,2,166);}
  for(let x=105;x<1560;x+=55)wall.fillStyle(x%110?0x777366:0x898477).fillRect(x,300,53,22);
  for(const x of [170,590,1070,1450]){wall.fillStyle(0x3c2b20).fillRect(x,115,19,210);wall.fillStyle(0xb17c43).fillRect(x+3,115,9,198);}
  for(const x of [330,1190]){wall.fillStyle(0x352b22).fillRect(x-73,155,146,106);wall.fillStyle(0x7eaaa4).fillRect(x-64,163,128,85);wall.fillStyle(0xe7df9b,.8).fillRect(x-60,166,120,8);wall.fillStyle(0xb78b50).fillRect(x-4,160,8,91).fillRect(x-65,203,130,7);}
  wall.fillStyle(0x402c20).fillRect(98,112,1476,16).fillRect(98,280,1476,12);
  // Lanterns and a tiled threshold make the entrance physically readable.
  for(const x of [610,1040]){const lamp=scene.add.graphics().setDepth(305);lamp.fillStyle(0x372e25).fillRect(x,180,18,32);lamp.fillStyle(0xe9c270).fillRect(x+4,186,10,19);scene.tweens.add({targets:lamp,alpha:.75,duration:1100+x,yoyo:true,repeat:-1});}
  const threshold=scene.add.graphics().setDepth(1);threshold.fillStyle(0x6a6353).fillRect(738,785,195,43);for(let x=744;x<930;x+=38)threshold.fillStyle(0xa99c7b).fillRect(x,790,35,30);
  if(id==='home'||id==='shed')this.furniture(id);
  else{
   for(const [index,x] of [220,1130].entries()){
    const bedding=scene.add.graphics().setDepth(1);this.straw.push(bedding);this.drawStraw(bedding,x,335,index);
    const rails=scene.add.graphics().setDepth(485);
    for(const [a,b] of [[x,x+80],[x+190,x+300]])this.rail(rails,a,b,480);
    for(const px of [x,x+80,x+190,x+300])this.post(rails,px,480);
    this.obstacles.push(rectangle(x-6,472,86,12),rectangle(x+190,472,116,12));
    const gate:RuralGate={id:`stall-${index}`,a:[x+80,480],b:[x+190,480],shape:rectangle(x+80,474,110,12),open:false,progress:0,holdUntil:0};this.gates.push(gate);
    this.gateArt.push(scene.add.graphics().setDepth(486));
    const hit=scene.add.zone(x+135,458,126,72).setDepth(490).setInteractive({useHandCursor:true});
    hit.on('pointerup',()=>{if(!canInteract())return;if(this.pinned.has(gate.id))this.pinned.delete(gate.id);else this.pinned.add(gate.id);});
    const trough=scene.add.graphics().setDepth(397);trough.fillStyle(0x362c22,.28).fillRect(x+212,370,86,28);trough.fillStyle(0x66472e).fillRect(x+210,352,82,34).fillStyle(0xbb8e50).fillRect(x+212,350,78,6).fillStyle(0x275d6a).fillRect(x+218,358,66,19);
    this.obstacles.push(rectangle(x+210,350,82,38));
    const waterHit=scene.add.zone(x+251,368,84,40).setDepth(401).setInteractive({useHandCursor:true});
    waterHit.on('pointerup',()=>{if(!canInteract())return;this.wet=true;if(id==='rabbit-hutch')onTask('water-rabbits');});
    const feed=scene.add.graphics().setDepth(398);this.feed.push(feed);feed.setPosition(x+35,365);this.drawFeed(feed,false);
    this.obstacles.push(rectangle(x+10,345,100,40));
    const foodTask:Partial<Record<InteriorId,TaskId>>={coop:'feed-chickens',barn:'feed-cows','horse-stable':'feed-horses','goat-shelter':'feed-goats','pig-shelter':'feed-pigs','rabbit-hutch':'feed-rabbits'};
    const foodHit=scene.add.zone(x+35,365,104,42).setDepth(401).setInteractive({useHandCursor:true});
    foodHit.on('pointerup',()=>{const task=foodTask[id];if(canInteract()&&task)onTask(task);});
    if(id==='rabbit-hutch')for(const dx of [25,165]){const h=scene.add.graphics().setDepth(370);h.fillStyle(0x65452d).fillRect(x+dx,320,80,50).fillStyle(0xb88950).fillRect(x+dx-5,310,90,12).fillStyle(0x30291f).fillRect(x+dx+23,343,30,27);this.obstacles.push(rectangle(x+dx,320,80,50));}
    if(id==='coop'){const n=scene.add.graphics().setDepth(345);n.fillStyle(0x67492e).fillRect(x+20,310,170,36);for(let k=0;k<3;k++)n.fillStyle(0xe3bd66).fillRect(x+29+k*54,320,39,16).fillStyle(0xf5e4bd).fillEllipse(x+46+k*54,326,12,16);}
   }
   if(id==='pig-shelter'){const mud=scene.add.graphics().setDepth(2);mud.fillStyle(0x64513c).fillRoundedRect(1150,575,235,105,20);mud.fillStyle(0x816346).fillRoundedRect(1160,580,215,90,18);}
   if(id==='horse-stable'){const bath=scene.add.graphics().setDepth(2);bath.fillStyle(0x777c72).fillRect(510,595,210,115);for(let y=601;y<704;y+=25)for(let x=516;x<716;x+=40)bath.fillStyle(0x9a9c85).fillRect(x,y,37,22);bath.fillStyle(0x343f3a).fillRect(600,672,30,13);for(let x=603;x<630;x+=7)bath.fillStyle(0x8c9284).fillRect(x,674,2,9);}
  }
  // Side walls are depth-sorted in front of the floor and behind foreground objects.
  for(const x of [98,1558]){const side=scene.add.graphics().setDepth(820);side.fillStyle(0x503927).fillRect(x,300,16,520).fillStyle(0xad7e44).fillRect(x,300,5,520);}
  this.water=scene.add.graphics().setDepth(399);
  scene.add.text(835,233,id==='rabbit-hutch'?'CONEJERA':id==='goat-shelter'?'REFUGIO DE CABRAS':id==='coop'?'GALLINERO':id==='horse-stable'?'ESTABLO':id==='pig-shelter'?'CORRAL DE CERDOS':id==='home'?'CASA DE LA JEFA':id==='shed'?'INVERNADERO':'VAQUERÍA',{fontFamily:'Georgia,serif',fontSize:'21px',color:'#efdab0',letterSpacing:3}).setOrigin(.5).setDepth(310);
 }
 private drawStraw(g:Phaser.GameObjects.Graphics,x:number,y:number,seed:number){g.clear().fillStyle(0xb99750,.55).fillEllipse(x+150,y+65,300,118);for(let k=0;k<180;k++){const xx=x+(k*47+seed*13)%295,yy=y+(k*29)%118;g.fillStyle([0xd1ae59,0xe4c574,0xb0873d][k%3]).fillRect(xx,yy,5+k%9,2);}}
 private drawFeed(g:Phaser.GameObjects.Graphics,full:boolean){g.clear().fillStyle(0x59402d).fillRect(-25,-10,98,28).fillStyle(0xab7d44).fillRect(-28,-14,104,6);g.fillStyle(0xc5a754).fillRect(-19,full?-8:0,86,full?20:10);for(let i=0;i<18;i++)g.fillStyle(i%2?0xead082:0x95a049).fillRect(-16+i*17%80,-5+i*13%14,9,2);}
 private rail(g:Phaser.GameObjects.Graphics,a:number,b:number,y:number){g.fillStyle(0x473020).fillRect(a,y-48,b-a,12).fillRect(a,y-24,b-a,10);g.fillStyle(0xb18249).fillRect(a,y-49,b-a,7).fillRect(a,y-25,b-a,5);}
 private post(g:Phaser.GameObjects.Graphics,x:number,y:number){g.fillStyle(0x634329).fillRect(x-7,y-64,15,70).fillStyle(0xc49755).fillRect(x-7,y-66,15,5).fillRect(x-5,y-60,4,62);}
 private furniture(id:InteriorId){for(const x of [250,1150]){const g=this.scene.add.graphics().setDepth(435);g.fillStyle(0x543c29).fillRect(x,330,200,100).fillStyle(0x9c7547).fillRect(x-8,317,216,22);this.obstacles.push(rectangle(x-8,317,216,113));if(id==='shed')for(let k=0;k<5;k++)g.fillStyle(0x855b35).fillRect(x+10+k*37,300,25,17).fillStyle(0x5f8540).fillRect(x+15+k*37,277,16,25);else g.fillStyle(0xb09469).fillRect(x+10,350,180,65).fillStyle(0xe8dbc0).fillRect(x+14,354,55,30);}}
 complete(task:TaskId){if(task.startsWith('feed-')){this.feeding=true;this.feed.forEach(g=>this.drawFeed(g,true));}if(task.startsWith('clean-'))this.straw.forEach((g,i)=>this.drawStraw(g,i?1130:220,335,i+7));if(task==='wash-horses'||task==='water-rabbits')this.wet=true;}
 update(time:number,delta:number,actors:readonly GateActor[]){
  this.gates.forEach((gate,i)=>{if(this.pinned.has(gate.id))gate.holdUntil=time+1500;advanceGate(gate,actors,time,delta);const art=this.gateArt[i];art.clear();this.rail(art,gate.a[0],gate.b[0]-gate.progress*98,480);art.fillStyle(0xd9bc73).fillRect(gate.b[0]-gate.progress*98-12,441,7,7);});
  const frame=Math.floor(time/140);if(frame===this.lastFrame)return;this.lastFrame=frame;this.water.clear();
  if(this.id!=='home'&&this.id!=='shed')for(const x of [438,1348]){this.water.fillStyle(this.wet?0x8bd3d0:0x70b2b5,.75);for(let k=0;k<3;k++)this.water.fillRect(x+(frame+k*13)%48,362+k*4,8+k*3,2);}
  if(this.feeding&&frame%12===0)this.feed.forEach(g=>this.scene.tweens.add({targets:g,alpha:.88,duration:300,yoyo:true}));
 }
}
