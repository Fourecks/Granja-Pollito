import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { ExteriorScene } from './game/ExteriorScene';
import type { FarmRuntime, SceneProps } from './game/types';
import { renderRatio } from './game/renderBudget';
export default function Scene(props:SceneProps){
 const host=useRef<HTMLDivElement>(null),propsRef=useRef(props);const [loading,setLoading]=useState(true);
 useEffect(()=>{propsRef.current=props;},[props]);
 useEffect(()=>{
  if(!host.current)return;
  const runtime:FarmRuntime={props:propsRef,room:null,owners:new Map(),completed:new Set(),busyWorkers:new Map(),loadedRooms:new Set(),loading:setLoading};
  const bounds=host.current.getBoundingClientRect(),dpr=renderRatio(bounds.width,bounds.height,window.devicePixelRatio);
  const game=new Phaser.Game({type:Phaser.AUTO,parent:host.current,pixelArt:true,roundPixels:true,antialias:false,backgroundColor:'#213a2e',
   scale:{mode:Phaser.Scale.NONE,width:Math.round(bounds.width*dpr),height:Math.round(bounds.height*dpr),zoom:1/dpr},scene:[new ExteriorScene(runtime)],render:{pixelArt:true,antialias:false,roundPixels:true}});
  game.registry.set('renderRatio',dpr);
  const observer=new ResizeObserver(([entry])=>{const width=Math.round(entry.contentRect.width*dpr),height=Math.round(entry.contentRect.height*dpr);if(game.scale.width===width&&game.scale.height===height)return;const center=game.scene.getScenes().map(scene=>({scene,x:scene.cameras.main.midPoint.x,y:scene.cameras.main.midPoint.y}));game.scale.resize(width,height);center.forEach(({scene,x,y})=>scene.cameras.main.centerOn(x,y));});observer.observe(host.current);
  return()=>{observer.disconnect();game.destroy(true);};
 },[]);
 return <div className="farm-world" ref={host} role="application" aria-label="Granja Pollito pixel art explorable">
  {loading&&<div className="world-loading" role="status"><span>🐥</span><small>Preparando Granja Pollito…</small></div>}
 </div>;
}
