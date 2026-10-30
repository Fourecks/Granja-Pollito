import Phaser from 'phaser';
import { rectangle, type Polygon } from '../navigation';
import { advanceGate, type RuralGate, type GateActor } from '../world/ruralGates';
import type { TaskId } from '../../domain';

function polygon(g:Phaser.GameObjects.Graphics,points:number[][]){g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath().fillPath();}

// Coordinates follow the isolated props, including their transparent margins.
const regions:Record<string,number[]>={nest:[8,42,312,305],hay:[323,42,321,304],grain:[662,45,301,303],sacks:[976,50,294,295],water:[24,365,294,278],feeder:[322,385,310,262],shelf:[645,350,318,307],tools:[982,370,285,284],flowers:[17,672,295,258],roost:[330,645,311,296],window:[672,667,267,279],lantern:[1030,661,202,280],closed:[14,945,309,300],open:[331,947,301,299],dust:[646,985,321,239],buckets:[980,969,286,263]};
export const coopFootprints=[rectangle(548,302,574,31),rectangle(125,493,215,53),rectangle(1330,445,178,40),rectangle(1290,560,170,75),rectangle(160,665,150,60),rectangle(1330,718,182,72),rectangle(195,385,105,38),rectangle(365,385,90,45),rectangle(250,550,95,45)];
export class CoopInterior {
 readonly walkable=[rectangle(125,320,1420,490)];
 readonly obstacles:Polygon[]=[...coopFootprints];
 readonly gates:RuralGate[]=[];
 private gatesArt:Phaser.GameObjects.Image[]=[];
 private pinned=new Set<string>();
 private straw:Phaser.GameObjects.Graphics;
 private water:Phaser.GameObjects.Graphics;
 private dust:Phaser.GameObjects.Graphics;
 private nests:Phaser.GameObjects.Image[]=[];
 private filled=false;private dustReady=false;private frame=-1;
 readonly props:Phaser.GameObjects.Image[]=[];
 constructor(private scene:Phaser.Scene,private canInteract:()=>boolean,private onTask:(id:TaskId)=>void){
  const atlas=scene.textures.get('coop-furniture'),source=atlas.getSourceImage();
  for(const [name,[x,y,w,h]] of Object.entries(regions))if(!atlas.has(name))atlas.add(name,0,Math.round(x*source.width/1280),Math.round(y*source.height/1280),Math.floor(w*source.width/1280),Math.floor(h*source.height/1280));
  this.shell();this.straw=scene.add.graphics().setDepth(2);this.bedding(false);
  for(const x of [681,975])this.nests.push(this.prop('nest',x,333,270,false));
  for(const [x,y,w] of [[238,253,118],[1440,300,125],[207,442,110],[1450,535,114]])this.prop('window',x,y,w,false).setDepth(304);
  this.prop('shelf',230,540,215);this.prop('shelf',1458,437,180);
  this.prop('sacks',397,429,108);this.prop('grain',243,415,112);
  this.prop('grain',1453,787,135);this.prop('sacks',1510,798,98);
  this.prop('hay',1350,606,190);this.prop('hay',1430,743,165);this.prop('hay',225,737,155);this.prop('hay',329,795,116);
  this.prop('water',298,583,105);this.prop('feeder',1415,484,193);
  this.prop('tools',151,660,88);this.prop('tools',1406,589,88);this.prop('buckets',180,788,100);this.prop('buckets',1310,793,92);
  this.prop('roost',247,650,150);this.prop('dust',488,684,165);
  for(const [x,y,w] of [[142,548,79],[325,353,62],[1245,304,73],[1497,641,77],[1225,790,86]])this.prop('flowers',x,y,w);
  for(const [x,y] of [[375,205],[835,130],[1310,208],[129,510],[1532,572],[621,775],[1053,775]]){
   const lamp=this.prop('lantern',x,y,44,false).setDepth(Math.max(306,y));scene.tweens.add({targets:lamp,alpha:.84,duration:900+x%300,yoyo:true,repeat:-1});
   const glow=scene.add.ellipse(x,y-30,100,120,0xffc766,.07).setDepth(300);scene.tweens.add({targets:glow,alpha:.5,duration:1400,yoyo:true,repeat:-1});
  }
  for(const [index,x] of [330,1250].entries()){
   const y=735,gate:RuralGate={id:`coop-divider-${index}`,a:[x-55,y],b:[x+55,y],shape:rectangle(x-55,y-5,110,10),open:false,progress:0,holdUntil:0};
   this.gates.push(gate);const art=this.prop('closed',x,y,145);this.gatesArt.push(art);
   const hit=scene.add.zone(x,y-35,145,90).setDepth(y+1).setInteractive({useHandCursor:true});hit.on('pointerup',()=>{if(!canInteract())return;if(this.pinned.has(gate.id))this.pinned.delete(gate.id);else this.pinned.add(gate.id);});
  }
  this.hotspot(835,274,560,100,'collect-eggs');this.hotspot(1415,445,190,85,'feed-chickens');this.hotspot(397,391,110,70,'feed-chickens');this.hotspot(488,655,160,75,'prepare-dust-bath');this.hotspot(151,613,75,110,'clean-coop');
  this.water=scene.add.graphics().setDepth(584);this.dust=scene.add.graphics().setDepth(685);
  const waterHit=scene.add.zone(298,555,105,65).setDepth(586).setInteractive({useHandCursor:true});waterHit.on('pointerup',()=>{if(!canInteract())return;this.filled=true;scene.tweens.add({targets:this.props.find(p=>p.getData('prop')==='water'),y:580,duration:160,yoyo:true});});
 }
 private prop(name:string,x:number,y:number,width:number,shadow=true){
  const r=regions[name],height=width*r[3]/r[2];
  if(shadow)this.scene.add.ellipse(x,y-2,width*.78,Math.min(21,width*.11),0x392013,.22).setDepth(y-.2);
  const sprite=this.scene.add.image(x,y,'coop-furniture',name).setOrigin(.5,1).setDisplaySize(width,height).setDepth(y).setData('prop',name);this.props.push(sprite);return sprite;
 }
 private hotspot(x:number,y:number,w:number,h:number,task:TaskId){const hit=this.scene.add.zone(x,y,w,h).setDepth(y+101).setInteractive({useHandCursor:true});hit.on('pointerup',()=>{if(this.canInteract())this.onTask(task);});}
 private shell(){
  const s=this.scene,g=s.add.graphics().setDepth(-20);g.fillStyle(0x181820).fillRect(0,0,1672,941).fillStyle(0x553521).fillRect(105,310,1460,525);
  for(let y=320;y<830;y+=24)for(let x=108;x<1560;x+=102){const xx=Math.max(108,x-(y/24%2|0)*40),ww=Math.min(100,1558-xx);g.fillStyle([0xa36b37,0xac733a,0xb47d3f,0x9e6835][Math.abs(x+y)%4]).fillRect(xx,y,ww,22);g.fillStyle(0xd69a51,.3).fillRect(xx+4,y+2,Math.max(0,ww-12),2);if(ww>90)g.fillStyle(0x55351e,.32).fillRect(xx+16,y+14,30,2).fillRect(xx+66,y+8,20,2);}
  const back=s.add.graphics().setDepth(300);back.fillStyle(0x513322).fillRect(300,71,1080,251);
  for(let x=304;x<1380;x+=23){back.fillStyle(x%46?0x81502e:0x75472b).fillRect(x,80,21,235);back.fillStyle(0xb07840,.5).fillRect(x+3,84,2,226);for(let k=0;k<4;k++)back.fillStyle(0x46291d,.4).fillRect(x+7,100+k*48,1,26);}
  back.fillStyle(0x39251c).fillRect(296,65,1092,20).fillRect(296,294,1092,26);back.fillStyle(0xb48048).fillRect(300,68,1080,5).fillRect(301,296,1076,5);
  for(const x of [315,540,1114,1349]){back.fillStyle(0x452c1d).fillRect(x,74,20,247);back.fillStyle(0xa7703c).fillRect(x+3,77,7,238);}
  for(const flip of [false,true]){const wall=s.add.graphics().setDepth(302),side=(x:number)=>flip?1672-x:x;
   wall.fillStyle(0x72462b);polygon(wall,[[side(99),310],[side(299),75],[side(299),320],[side(99),790]]);
   for(let i=0;i<12;i++){const x=110+i*16,top=310-i*18;wall.fillStyle(i%2?0xa36a37:0x88532e).fillRect(side(x),top,flip?-12:12,Math.max(100,455-i*19));}
  }
  const beams=s.add.graphics().setDepth(305);beams.fillStyle(0x43291c);polygon(beams,[[92,306],[306,65],[323,72],[109,324]]);polygon(beams,[[1580,306],[1366,65],[1349,72],[1563,324]]);beams.fillStyle(0xbc8447);polygon(beams,[[99,306],[308,72],[312,79],[106,314]]);polygon(beams,[[1573,306],[1364,72],[1360,79],[1566,314]]);
  const light=s.add.graphics().setDepth(1);light.fillStyle(0xffd984,.09);polygon(light,[[350,334],[445,334],[728,687],[478,715]]);light.fillStyle(0xffd984,.08);polygon(light,[[1220,340],[1310,340],[1170,715],[990,675]]);
  // Lower timber frame leaves the entrance and middle aisle open.
  for(const [x,w] of [[100,620],[950,620]]){const front=s.add.graphics().setDepth(815);front.fillStyle(0x452a1c).fillRect(x,811,w,32).fillStyle(0xb27a3d).fillRect(x,811,w,6);}
  const step=s.add.graphics().setDepth(0);for(let i=0;i<5;i++)step.fillStyle(i%2?0xb98242:0x996232).fillRect(741-i*5,810+i*21,190+i*10,19);
 }
 private bedding(clean:boolean){
  const g=this.straw;g.clear();
  // Dense clusters hug the walls; smaller wisps spill onto the walking boards.
  let seed=clean?814:417;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<85;i++){const x=140+random()*1390,y=345+random()*445;if(x>410&&x<1240&&y>405&&y<725)continue;g.fillStyle(0xc69a43,.23).fillEllipse(x,y,45+random()*90,15+random()*27);}
  for(let i=0;i<7600;i++){
   const x=135+random()*1390,y=340+random()*465,edge=x<405||x>1260||y<405||y>730;
   if(!edge&&random()>.26)continue;
   const length=3+Math.floor(random()*12),slope=(random()-.5)*1.25;
   g.fillStyle([0xd4a64d,0xe8bd5b,0xf1ca70,0xb88a3e][i%4],edge?.9:.65);
   for(let j=0;j<length;j+=3)g.fillRect(Math.round(x+j),Math.round(y+j*slope),3,1+i%2);
  }
  if(clean)g.fillStyle(0xf4d180,.4).fillEllipse(833,650,400,26);
 }
 complete(task:TaskId){if(task==='collect-eggs')this.nests.forEach(s=>s.setTint(0xe1cfaa));if(task==='feed-chickens')this.filled=true;if(task==='prepare-dust-bath')this.dustReady=true;if(task==='clean-coop')this.bedding(true);}
 update(time:number,delta:number,actors:readonly GateActor[]){
  this.gates.forEach((g,i)=>{if(this.pinned.has(g.id))g.holdUntil=time+1500;advanceGate(g,actors,time,delta);this.gatesArt[i].setFrame(g.progress>.65?'open':'closed');});
  const frame=Math.floor(time/160);if(frame===this.frame)return;this.frame=frame;this.water.clear().lineStyle(2,this.filled?0xb8eeeb:0x85c6d6,.75);this.water.strokeEllipse(298,568,27+(frame%6)*3,5+(frame%6));this.water.fillStyle(0xc6e6e0,.8).fillRect(280+frame%25,567,5,2);
  this.dust.clear();if(this.dustReady)for(let i=0;i<6;i++)this.dust.fillStyle(0xe1c998,.45).fillRect(443+(frame*3+i*23)%90,660-(frame+i*5)%24,3,2);
 }
}
