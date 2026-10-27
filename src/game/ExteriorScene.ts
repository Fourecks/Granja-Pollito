import Phaser from 'phaser';
import { CelebrationEvent } from './events/CelebrationEvent';
import { CELEBRATION_MODE } from '../data/celebration';
import type { InteriorId } from '../data/world';
import { WorldScene } from './WorldScene';
import { CameraControls } from './camera';
import { createFrames } from './assets';
import { cleanTextureFrames } from './textureCleanup';
import { NavigationGrid } from './navigation';
import { MAP, SCALE } from './world/mapConfig';
import { navigation } from './world/collisions';
import { TerrainLayers } from './world/terrain';
import { SubmergedCliffLayer } from './world/SubmergedCliffLayer';
import { RampLayer } from './world/RampLayer';
import { BridgeLayer } from './world/BridgeLayer';
import { WaterLayer } from './world/water';
import { VegetationLayer } from './world/vegetation';
import { ActorGrassOcclusionLayer } from './world/actorGrassOcclusion';
import { WindSystem } from './world/wind';
import { TulipFieldLayer } from './world/TulipFieldLayer';
import { createTulipFieldPlan } from './world/tulipFieldPlan';
import { zoneById, zones } from './world/zones';
import type { FarmRuntime } from './types';
// Phase 2 adds nature above the unchanged foundation; existing task actors remain.
export class ExteriorScene extends WorldScene {
 readonly wind=new WindSystem();
 private bridges!:BridgeLayer;private ramps!:RampLayer;private submerged!:SubmergedCliffLayer;
 private actorGrass!:ActorGrassOcclusionLayer;
 private tulips!:TulipFieldLayer;private vegetation!:VegetationLayer;private terrain!:TerrainLayers;private water!:WaterLayer;private diagnosticAt=0;private entering=false;private celebration?:CelebrationEvent;
 constructor(runtime:FarmRuntime){super('Exterior',runtime);}
 preload(){for(const style of ['rustic','stone'])this.load.atlas(`bridge-${style}`,`/assets/bridge-${style}-${style==='stone'?'v2':'v1'}.png`,`/assets/bridge-${style}-${style==='stone'?'v2':'v1'}.json`);for(const kind of ['medium','small'])this.load.atlas(`waterfall-${kind}`,`/assets/waterfall-${kind}-v2.png`,`/assets/waterfall-${kind}-v2.json`);this.load.atlas('water-depth-art','/assets/water-depth-v1.png','/assets/water-depth-v1.json');this.load.image('actors','/assets/actors-v2.webp');this.load.atlas('vegetation','/assets/vegetation-atlas.png','/assets/vegetation-atlas.json');this.load.atlas('tulip-garden','/assets/tulip-garden-atlas.png','/assets/tulip-garden-atlas.json');this.load.atlas('tulip-flowers','/assets/tulip-flowers-v2.png','/assets/tulip-flowers-v2.json');}
 create(){
  createFrames(this,true);
  cleanTextureFrames(this,'actors');
  cleanTextureFrames(this,'bridge-stone',['post']);
  cleanTextureFrames(this,'vegetation',this.textures.get('vegetation').getFrameNames().filter(n=>!['LEAVES','PETALS_PINK','PETALS_WHITE','FIREFLY','LILY_PAD','LILY_FLOWER','WATER_GRASS','CATTAILS','REEDS_01','REEDS_02'].includes(n)&&!n.startsWith('GRASS')&&!n.startsWith('WEEDS')));
  cleanTextureFrames(this,'tulip-garden',['BENCH','ARCH','FENCE']);
  this.terrain=new TerrainLayers(this);this.submerged=new SubmergedCliffLayer(this,this.terrain.masks);this.water=new WaterLayer(this,this.terrain.masks,this.submerged.fade);this.bridges=new BridgeLayer(this,this.terrain.masks);this.ramps=new RampLayer(this,this.terrain.masks);
  this.vegetation=new VegetationLayer(this,this.terrain.masks,this.wind,this.water.habitat);
  this.nav=new NavigationGrid({...navigation,obstacles:[...navigation.obstacles,...this.vegetation.plan.obstacles]},7);
  const garden=createTulipFieldPlan(this.vegetation.plan,this.nav);
  this.tulips=new TulipFieldLayer(this,garden,this.wind,this.terrain.masks);
  this.nav=garden.nav;
  this.vegetation.addFlowerHabitat(garden.flowers.filter((_,i)=>i%500===0).slice(0,4).map(p=>[p.x,p.y]));
  const camera=this.cameras.main,fit=Math.max(this.scale.width/MAP.width,this.scale.height/MAP.height),dpr=Math.min(window.devicePixelRatio||1,2);
  camera.setBounds(0,0,MAP.width,MAP.height).setZoom(this.scale.width/dpr<760?Math.max(fit,.85*dpr):fit).centerOn(...zoneById.centralPlaza.center);
  this.controls=new CameraControls(this,fit,2.4*dpr,MAP);
  this.addWorkers();this.actorGrass=new ActorGrassOcclusionLayer(this,this.water.habitat,this.vegetation.displayPlants);
  if(CELEBRATION_MODE)this.celebration=new CelebrationEvent(this,MAP,zoneById.centralPlaza.center);
  const enter=(event:Event)=>{if(this.input.enabled)void this.enter((event as CustomEvent<InteriorId>).detail);};
  window.addEventListener('farm-enter',enter);this.events.once('shutdown',()=>window.removeEventListener('farm-enter',enter));
  for(const z of zones.filter(z=>z.legacyObject)){
   const xs=z.shape.map(p=>p[0]),ys=z.shape.map(p=>p[1]);
   const hit=this.add.zone(...z.center,Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys)).setDepth(-9);
   hit.setInteractive(new Phaser.Geom.Polygon(z.shape.map(([x,y])=>({x:x-Math.min(...xs),y:y-Math.min(...ys)}))),Phaser.Geom.Polygon.Contains);
   hit.on('pointerup',()=>{if(!this.controls.moved)this.runtime.props.current.onSelect(z.legacyObject!);});
  }
  this.game.canvas.dataset.mapVersion='phase-3.5-bridge-junction';this.game.canvas.dataset.mapSize=`${MAP.width}x${MAP.height}`;
  this.game.canvas.dataset.humanHeight=String(SCALE.humanHeight);
  this.events.once('shutdown',()=>{this.actors=[];});
  this.runtime.loading(false);camera.fadeIn(350);
 }
 async enter(id:InteriorId){
  if(this.entering||this.runtime.room)return;this.entering=true;this.runtime.props.current.onSelect('');
  this.runtime.loading(true);
  try{
   const {InteriorScene}=await import('./InteriorScene');
   if(!this.runtime.loadedRooms.has(id)){this.scene.add(`Interior-${id}`,new InteriorScene(this.runtime,id),false);this.runtime.loadedRooms.add(id);}
   this.cameras.main.fadeOut(200);this.cameras.main.once('camerafadeoutcomplete',()=>{
    this.scene.setVisible(false);this.input.enabled=false;this.runtime.room=id;this.runtime.props.current.onLocation(id);
    const key=`Interior-${id}`;if(this.scene.isActive(key)){const scene=this.scene.get(key);this.scene.setVisible(true,key);scene.input.enabled=true;scene.cameras.main.fadeIn(300);this.runtime.loading(false);}else this.scene.launch(key);
    this.entering=false;
   });
  }catch(error){console.error(error);this.runtime.loading(false);this.entering=false;}
 }
 update(time:number,delta:number){
  super.update(time,delta);this.celebration?.update(time,delta);if(!this.scene.isVisible())return;
  this.terrain.cull();this.water.update(time);this.submerged.update(this.cameras.main.worldView);this.bridges.update(time);this.ramps.update(this.cameras.main.worldView);this.vegetation.update(time,delta);this.tulips.update(time);this.actorGrass.update(this.actors);
  if(time-this.diagnosticAt>750){this.diagnosticAt=time;const c=this.cameras.main;
   this.game.canvas.dataset.world=JSON.stringify({version:'phase-3.5-bridge-junction',renderer:this.game.renderer.type,vegetation:this.vegetation.diagnostics,tulipField:this.tulips.diagnostics,fps:Math.round(this.game.loop.actualFps),waterFrame:this.water.animationFrame,water:this.water.diagnostics,bridges:this.bridges.diagnostics,ramps:this.ramps.diagnostics,submerged:this.submerged.diagnostics,actorGrass:this.actorGrass.diagnostics,chunks:this.terrain.objects.length,visibleChunks:this.terrain.objects.filter(o=>o.visible).length,zoom:c.zoom,camera:[Math.round(c.worldView.x),Math.round(c.worldView.y),Math.round(c.worldView.width),Math.round(c.worldView.height)],actors:this.actors.map(a=>({id:a.id,x:Math.round(a.x),y:Math.round(a.y),state:a.state,route:a.route.length,walkable:a.nav.canWalk(a.x,a.y)}))});
  }
 }
}
