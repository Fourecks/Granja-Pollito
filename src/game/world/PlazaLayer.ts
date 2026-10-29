import Phaser from 'phaser';
import { fountainCenter, plazaBenches } from './plazaPlan';
export class PlazaLayer {
 private water:Phaser.GameObjects.Graphics;private at=0;
 constructor(private scene:Phaser.Scene){
  const [x,y]=fountainCenter;
  scene.add.ellipse(x+3,y+8,112,52,0x62573b,.2).setDepth(y-24);
  scene.add.image(x,y+30,'plaza-fountain').setOrigin(.5,1).setDisplaySize(110,102).setDepth(y+23);
  for(const [bx,by] of plazaBenches){
   scene.add.ellipse(bx+3,by,58,12,0x53472c,.2).setDepth(by-.2);
   const image=scene.add.image(bx,by+3,'tulip-garden','BENCH').setOrigin(.5,1).setDepth(by);
   image.setScale(62/image.width).setData('plazaBench',true);
  }
  this.water=scene.add.graphics().setPosition(x,y+30).setDepth(y+23.1);
 }
 update(time:number){
  if(time<this.at)return;this.at=time+80;const g=this.water;g.clear();
  const visible=this.scene.cameras.main.worldView.contains(...fountainCenter);g.setVisible(visible);if(!visible)return;
  // Falling highlights travel independently; stone and surrounding world stay fixed.
  for(const [i,stream] of [[-22,-77,-53],[-15,-73,-52],[0,-70,-34],[14,-74,-52],[21,-78,-52]].entries()){
   const [x,top,bottom]=stream,p=(time/510+i*.27)%1;
   g.fillStyle(0x3aadd6,.85).fillRect(x,top,1,bottom-top);
   g.fillStyle(0xc5f4f5,.9).fillRect(x,Math.round(top+p*(bottom-top-3)),1,3);
   const wave=(time/830+i*.31)%1,w=3+wave*8;
   g.lineStyle(1,0xb3e9ed,(1-wave)*.7).strokeEllipse(x,bottom+1,w,w*.36);
   g.fillStyle(0xd5f5ee,.8).fillRect(x-2+Math.floor(Math.sin(time/150+i)*2),bottom-1,2,1);
   if(p<.65)g.fillRect(x+(i%2?3:-3),Math.round(bottom-4-Math.sin(p*Math.PI)*3),1,1);
  }
  // Small crown jet rises from the upper bowl, then falls back into it.
  for(let i=0;i<17;i++){
   const t=i/16,x=Math.round(-8+16*t),y=Math.round(-79-12*Math.sin(Math.PI*t));
   g.fillStyle(i%4===Math.floor(time/110)%4?0xdbfaf3:0x67c9e3,.86).fillRect(x,y,1,2);
  }
  for(let i=0;i<3;i++){const p=(time/1600+i/3)%1;g.lineStyle(1,0x8ad6df,(1-p)*.4).strokeEllipse(-9, -28+p*4,12+p*32,3+p*8);}
 }
 get diagnostics(){return {fountain:fountainCenter,benches:plazaBenches.length,animatedJets:6,solidBasin:true};}
}
