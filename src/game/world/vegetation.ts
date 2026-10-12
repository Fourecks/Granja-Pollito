import Phaser from 'phaser';
import { MAP } from './mapConfig';
import type { WorldMasks } from './terrain';
import { MicroGrassLayer } from './microGrass';
import { resolveVegetationOccupancy } from './vegetationOccupancy';
import { blendVegetationBases } from './vegetationIntegration';
import { WindSystem, type WindFamily, type WindVariation } from './wind';
import { createVegetationPlan, type Plant, type VegetationPlan } from './vegetationPlan';
interface Moving {sprite:Phaser.GameObjects.Image;home:Plant;phase:number;age:number;life:number;}
export class VegetationLayer {
 readonly plan:VegetationPlan=createVegetationPlan();
 private visual=resolveVegetationOccupancy(this.plan);
 readonly objects:Phaser.GameObjects.Image[]=[];
 private tall:Array<{sprite:Phaser.GameObjects.Image;plant:Plant}>=[];
 private microGrass:MicroGrassLayer;
 private windPlants:Array<{sprite:Phaser.GameObjects.Image;family:WindFamily;variation:WindVariation;amplitude:number}>=[];
 private butterflies:Moving[]=[];private motes:Moving[]=[];private fireflies:Moving[]=[];
 private flowers:Plant[]=[];private blossoms:Plant[]=[];private trees:Plant[]=[];
 private nextCull=0;private nextMote=0;private twilight=false;
 constructor(private scene:Phaser.Scene,masks:WorldMasks,readonly wind:WindSystem){
  this.microGrass=new MicroGrassLayer(scene,masks,this.plan,this.wind);
  const sheet=scene.textures.get('vegetation');
  const source=sheet.getSourceImage() as HTMLImageElement;
  const ground=document.createElement('canvas');ground.width=MAP.width/2;ground.height=MAP.height/2;
  const ctx=ground.getContext('2d')!;ctx.imageSmoothingEnabled=false;
  blendVegetationBases(scene,ctx,masks,{plants:this.visual.plants,obstacles:this.plan.obstacles});
  for(const p of this.visual.plants){
   if(p.name.includes('FLOWER')||p.name.startsWith('BUSH_FLOWER'))this.flowers.push(p);
   if(p.name.includes('BLOSSOM')||p.name==='CHERRY_TREE')this.blossoms.push(p);
   if(p.name!=='TREE_STUMP'&&(p.name.includes('TREE')||p.name.startsWith('PINE')))this.trees.push(p);
   const frame=sheet.get(p.name),width=p.drawWidth;
   const flowerSway=p.ground&&p.name.startsWith('FLOWERS_')&&this.windPlants.filter(o=>o.family==='flowers').length<20&&Math.abs(Math.sin(p.x*.31+p.y*.17))>.98;
   if(p.ground&&!flowerSway){ctx.drawImage(source,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,Math.round(p.x/2-width/4),Math.round(p.y/2-p.height*.48),Math.round(width/2),Math.round(p.height/2));continue;}
   const sprite=scene.add.image(p.x,p.y,'vegetation',p.name).setOrigin(.5,.96).setDisplaySize(width,p.height).setDepth(p.y);
   this.tall.push({sprite,plant:p});this.objects.push(sprite);
   if(p.sway&&this.windPlants.filter(o=>o.family==='tallGrass'||o.family==='reeds').length<36)this.windPlants.push({sprite,family:p.name.startsWith('REEDS')?'reeds':'tallGrass',variation:this.wind.variation(p.x,p.y),amplitude:.06});
   if(flowerSway)this.windPlants.push({sprite,family:'flowers',variation:this.wind.variation(p.x,p.y),amplitude:.025});
   if(p.name.startsWith('BAMBOO')&&this.windPlants.filter(o=>o.family==='bamboo').length<24)this.windPlants.push({sprite,family:'bamboo',variation:this.wind.variation(p.x,p.y),amplitude:.014});
   if(p.name.startsWith('TREE_GREEN')&&this.windPlants.filter(o=>o.family==='canopy').length<8)this.windPlants.push({sprite,family:'canopy',variation:this.wind.variation(p.x,p.y),amplitude:.008});
  }
  // Bake small non-blocking detail into transparent 256-world-unit chunks.
  for(let y=0;y<ground.height;y+=128)for(let x=0;x<ground.width;x+=128){
   const c=document.createElement('canvas');c.width=c.height=128;const cc=c.getContext('2d')!;cc.drawImage(ground,x,y,128,128,0,0,128,128);
   if(!cc.getImageData(0,0,128,128).data.some((v,i)=>i%4===3&&v))continue;
   const key=`vegetation-ground-${x}-${y}`;if(scene.textures.exists(key))scene.textures.remove(key);scene.textures.addCanvas(key,c);
   this.objects.push(scene.add.image(x*2,y*2,key).setOrigin(0).setScale(2).setDepth(-8));
  }
  for(let i=0;i<18;i++){const home=this.flowers[Math.floor(i*this.flowers.length/18)]??this.plan.plants[0];
   const name=['BLUE_BUTTERFLY','YELLOW_BUTTERFLY','PINK_BUTTERFLY','ORANGE_BUTTERFLY'][i%4];
   const sprite=scene.add.image(home.x,home.y-24,'vegetation',name).setDisplaySize(11,10).setDepth(home.y+25);
   this.butterflies.push({sprite,home,phase:i*2.37,age:0,life:0});
  }
  for(let i=0;i<28;i++)this.motes.push({sprite:scene.add.image(0,0,'vegetation','LEAVES').setVisible(false).setActive(false),home:this.trees[0],phase:i,age:0,life:0});
  for(let i=0;i<10;i++){const home=this.plan.plants.filter(p=>p.biome==='panda'||p.biome==='north')[i*7];if(!home)continue;
   this.fireflies.push({sprite:scene.add.image(home.x,home.y-25,'vegetation','FIREFLY').setDisplaySize(14,14).setVisible(false),home,phase:i,age:0,life:0});}
 }
 addFlowerHabitat(points:readonly (readonly [number,number])[]){
  for(let i=0;i<Math.min(4,points.length);i++){const m=this.butterflies[i],p=points[i];m.home={...m.home,x:p[0],y:p[1],biome:'tulips'};}
 }
 setTwilight(enabled:boolean){this.twilight=enabled;}
 update(time:number,delta:number){
  const view=this.scene.cameras.main.worldView;
  if(time>=this.nextCull){this.nextCull=time+160;for(const sprite of this.objects)sprite.setVisible(Phaser.Geom.Rectangle.Overlaps(view,sprite.getBounds()));}
  this.microGrass.update(time);
  for(const {sprite,family,variation,amplitude} of this.windPlants)if(sprite.visible)sprite.setRotation(this.wind.response(family,time,variation)*amplitude*Math.cos(this.wind.direction));
  for(const m of this.butterflies){const visible=view.contains(m.home.x,m.home.y);m.sprite.setVisible(visible);if(!visible)continue;
   const t=time/1000+m.phase;m.sprite.setPosition(m.home.x+Math.sin(t*.71)*26+Math.sin(t*1.93)*9,m.home.y-24+Math.cos(t*.83)*15).setDepth(m.sprite.y+30);
   m.sprite.setDisplaySize(4+Math.abs(Math.sin(time/95+m.phase))*7,9).setRotation(Math.sin(t)*.12);
  }
  // Reuse a fixed pool; spawn only around visible trees. No hidden-frame work.
  if(time>=this.nextMote){this.nextMote=time+1100;const pool=this.motes.find(m=>!m.sprite.active),petal=Math.floor(time/1100)%3===0;
   const sources=(petal?this.blossoms:this.trees).filter(p=>view.contains(p.x,p.y));
   if(pool&&sources.length){const home=sources[Math.floor(time/1100)%sources.length];pool.home=home;pool.age=0;pool.life=5500;pool.phase=time*.001;
    pool.sprite.setTexture('vegetation',petal?(home.name==='TREE_BLOSSOM_WHITE'?'PETALS_WHITE':'PETALS_PINK'):'LEAVES').setDisplaySize(petal?8:7,petal?6:7).setPosition(home.x,home.y-home.height*.7).setDepth(home.y+1).setAlpha(.7).setActive(true).setVisible(true);}
  }
  for(const m of this.motes){if(!m.sprite.active)continue;m.age+=Math.min(delta,80);if(m.age>m.life||!view.contains(m.home.x,m.home.y)){m.sprite.setVisible(false).setActive(false);continue;}
   const t=m.age/1000,drift=Math.max(0,Math.min(1,this.wind.strength))*t*12;m.sprite.setPosition(m.home.x+Math.sin(t*1.8+m.phase)*12+Math.cos(this.wind.direction)*drift,m.home.y-m.home.height*.7+t*14+Math.sin(this.wind.direction)*drift*.35).setAlpha(.7*(1-m.age/m.life)).setRotation(t*.4);
  }
  for(const m of this.fireflies){const visible=this.twilight&&view.contains(m.home.x,m.home.y);m.sprite.setVisible(visible);if(visible)m.sprite.setPosition(m.home.x+Math.sin(time/1700+m.phase)*20,m.home.y-18+Math.cos(time/2100+m.phase)*12).setAlpha(.3+.5*(1+Math.sin(time/650+m.phase))/2).setDepth(m.home.y+25);}
 }
 get diagnostics(){return {plants:this.plan.plants.length,displayPlants:this.visual.plants.length,occupancy:{structural:this.visual.structuralCount,suppressed:this.visual.suppressed,merged:this.visual.merged},solids:this.plan.obstacles.length,sprites:this.tall.length,visible:this.objects.filter(o=>o.visible).length,butterflies:this.butterflies.filter(m=>m.sprite.visible).length,motes:this.motes.filter(m=>m.sprite.active).length,fireflies:this.fireflies.filter(m=>m.sprite.visible).length,sway:this.windPlants.length,microGrass:this.microGrass.diagnostics,biomes:Object.fromEntries(['north','panda','coast','shore','garden','landmark'].map(b=>[b,this.plan.plants.filter(p=>p.biome===b).length]))};}
}
