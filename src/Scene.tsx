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
  const game=new Phaser.Game({type:Phaser.AUTO,parent:host.current,pixelArt:true,roundPixels:true,antialias:false,backgroundColor:'#213a2e',
   scale:{mode:Phaser.Scale.RESIZE,width:'100%',height:'100%'},scene:[new ExteriorScene(runtime)],render:{pixelArt:true,antialias:false,roundPixels:true}});
  return()=>game.destroy(true);
 },[]);
 return <div className="farm-world" ref={host} role="application" aria-label="Granja Pollito pixel art explorable">
  {loading&&<div className="world-loading" role="status"><span>🐥</span><small>Preparando Granja Pollito…</small></div>}
 </div>;
}
