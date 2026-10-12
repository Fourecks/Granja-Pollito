import Phaser from 'phaser';
export class CameraControls {
 moved=false;
 private dragging=false; private distance=0; private start={x:0,y:0}; private last={x:0,y:0}; private velocity={x:0,y:0};
 constructor(private scene:Phaser.Scene, private minZoom:number, private maxZoom=2.4) {
  scene.input.addPointer(1);
  const touches=()=>[scene.input.pointer1,scene.input.pointer2].filter(p=>p.isDown);
  scene.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{
   if(p.button!==0)return;const fingers=touches();this.velocity={x:0,y:0};
   if(fingers.length>1){this.distance=Phaser.Math.Distance.Between(fingers[0].x,fingers[0].y,fingers[1].x,fingers[1].y);this.dragging=false;this.moved=true;return;}
   this.start=this.last={x:p.x,y:p.y};this.dragging=true;this.moved=false;
  });
  scene.input.on('pointermove',(p:Phaser.Input.Pointer)=>{
   const fingers=touches(),c=scene.cameras.main;
   if(fingers.length>1){const d=Phaser.Math.Distance.Between(fingers[0].x,fingers[0].y,fingers[1].x,fingers[1].y);if(this.distance)c.setZoom(Phaser.Math.Clamp(c.zoom*d/this.distance,this.minZoom,this.maxZoom));this.distance=d;this.moved=true;return;}
   if(!this.dragging||!p.isDown)return;
   if(Math.hypot(p.x-this.start.x,p.y-this.start.y)>7)this.moved=true;
   const dx=p.x-this.last.x,dy=p.y-this.last.y;
   if(this.moved){c.scrollX-=dx/c.zoom;c.scrollY-=dy/c.zoom;this.velocity={x:-dx/c.zoom*.06,y:-dy/c.zoom*.06};}
   this.last={x:p.x,y:p.y};
  });
  scene.input.on('pointerup',()=>{this.dragging=false;this.distance=0;});
  scene.input.on('wheel',(_p:unknown,_o:unknown,_x:number,y:number)=>this.zoom(y));
  const onZoom=(event:Event)=>{if(scene.input.enabled)this.zoom((event as CustomEvent<number>).detail);};
  window.addEventListener('farm-zoom',onZoom);scene.events.once('shutdown',()=>window.removeEventListener('farm-zoom',onZoom));
 }
 zoom(delta:number){const c=this.scene.cameras.main;c.setZoom(Phaser.Math.Clamp(c.zoom*(delta<0?1.12:.89),this.minZoom,this.maxZoom));}
 update(delta:number){if(!this.scene.input.enabled)return;if(!this.dragging&&(Math.abs(this.velocity.x)+Math.abs(this.velocity.y)>.02)){const c=this.scene.cameras.main;c.scrollX+=this.velocity.x*delta;c.scrollY+=this.velocity.y*delta;this.velocity.x*=.9;this.velocity.y*=.9;}}
}
