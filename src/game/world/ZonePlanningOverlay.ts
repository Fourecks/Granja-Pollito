import Phaser from 'phaser';
import { zonePlanning, roadConnection } from './zonePlanning';
export class ZonePlanningOverlay {
 constructor(scene:Phaser.Scene){
  const g=scene.add.graphics().setDepth(100000);
  const objects:Array<Phaser.GameObjects.Graphics|Phaser.GameObjects.Text>=[g];
  for(const p of zonePlanning){
   const color=p.kind==='habitat'?0x79ef9c:p.kind==='building'?0xffcd68:0x82cfff;
   g.fillStyle(color,.09).lineStyle(2,color,.8);
   const points=p.area.map(([x,y])=>new Phaser.Math.Vector2(x,y));g.fillPoints(points,true);g.strokePoints(points,true);
   const [x,y]=p.center,f=p.footprint;
   if(f){g.fillStyle(color,.22).fillRect(x-f.width/2,y-f.depth/2,f.width,f.depth).lineStyle(3,color,1).strokeRect(x-f.width/2,y-f.depth/2,f.width,f.depth);}
   if(p.door){const q=roadConnection(p);if(q){g.lineStyle(5,0x50e9e0,.9).lineBetween(...p.door,...q);g.fillStyle(0x50e9e0).fillCircle(...q,4);}g.fillStyle(0xffffff).fillCircle(...p.door,7);}
   const text=scene.add.text(x,y-(f?f.depth/2:0)-12,`${p.name}\n${p.id}${f?` · ${f.width}×${f.depth}`:' · sin edificio'}`,{fontFamily:'sans-serif',fontSize:'19px',color:'#ffffff',backgroundColor:'#17271f',padding:{x:6,y:4},align:'center'}).setOrigin(.5,1).setDepth(100001);
   objects.push(text);
   text.setInteractive({useHandCursor:true}).on('pointerup',()=>{scene.cameras.main.centerOn(x,y);});
  }
  const legend=scene.add.text(16,108,'PLAN PROPUESTO · P: ocultar/mostrar\nÁmbar: edificio (suelo) · Verde: hábitat · Azul: campo/plaza\nBlanco: puerta · Turquesa: enlace propuesto al camino\nSin cambios en colisiones, tareas ni terreno.',{fontSize:'15px',color:'#ffffff',backgroundColor:'#17271f',padding:{x:8,y:6}}).setScrollFactor(0).setDepth(100002);
  objects.push(legend);
  const toggle=()=>{for(const o of objects)(o as Phaser.GameObjects.Graphics).setVisible(!(o as Phaser.GameObjects.Graphics).visible);};
  scene.input.keyboard?.on('keydown-P',toggle);
  scene.events.once('shutdown',()=>scene.input.keyboard?.off('keydown-P',toggle));
 }
}
