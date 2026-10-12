import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { ExteriorScene } from './game/ExteriorScene';
import type { FarmRuntime, SceneProps } from './game/types';
export default function Scene(props:SceneProps){
 const host=useRef<HTMLDivElement>(null),propsRef=useRef(props);const [loading,setLoading]=useState(true);
 useEffect(()=>{propsRef.current=props;},[props]);
 useEffect(()=>{
  if(!host.current)return;
  const runtime:FarmRuntime={props:propsRef,room:null,owners:new Map(),completed:new Set(),busyWorkers:new Map(),loadedRooms:new Set(),loading:setLoading};
  const dpr=Math.min(window.devicePixelRatio||1,2),bounds=host.current.getBoundingClientRect();
  const game=new Phaser.Game({type:Phaser.AUTO,parent:host.current,pixelArt:true,roundPixels:true,antialias:false,backgroundColor:'#213a2e',
   scale:{mode:Phaser.Scale.NONE,width:Math.round(bounds.width*dpr),height:Math.round(bounds.height*dpr),zoom:1/dpr},scene:[new ExteriorScene(runtime)],render:{pixelArt:true,antialias:false,roundPixels:true}});
  const observer=new ResizeObserver(([entry])=>{const center=game.scene.getScenes().map(scene=>({scene,x:scene.cameras.main.midPoint.x,y:scene.cameras.main.midPoint.y}));game.scale.resize(Math.round(entry.contentRect.width*dpr),Math.round(entry.contentRect.height*dpr));center.forEach(({scene,x,y})=>scene.cameras.main.centerOn(x,y));});observer.observe(host.current);
  return()=>{observer.disconnect();game.destroy(true);};
 },[]);
 return <div className="farm-world" ref={host} role="application" aria-label="Granja Pollito pixel art explorable">
  {loading&&<div className="world-loading" role="status"><span>🐥</span><small>Preparando Granja Pollito…</small></div>}
 </div>;
}
