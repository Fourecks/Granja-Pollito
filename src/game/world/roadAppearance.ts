import { MAP, roads, curve } from './mapConfig';
import type { Polygon } from '../navigation';
/** Rendering corrections only: historical routes, collision and parcel masks stay intact. */
export const roadTieIns:Array<{id:string;line:Polygon;width:number;destination:string}>=[
 {id:'west-shore-loop',line:curve([[192,753],[195,736],[203,721]],12),width:22,destination:'ducks-lake / west-coast'},
 {id:'forest-logging-access',line:curve([[491,52],[500,65],[503,77]],12),width:22,destination:'existing stump at (1020,153)'},
 {id:'east-coast-access',line:curve([[1507,779],[1509,790],[1510,795]],12),width:24,destination:'existing coastal sand above the cliff'},
];
export function visualRoadMask(surfaces:Uint8ClampedArray){
 const c=document.createElement('canvas');c.width=MAP.width/2;c.height=MAP.height/2;
 const ctx=c.getContext('2d',{willReadFrequently:true})!;ctx.strokeStyle='#fff';ctx.lineCap='round';ctx.lineJoin='round';
 for(const road of [...roads,...roadTieIns]){
  ctx.lineWidth=road.width/2;ctx.beginPath();road.line.forEach(([x,y],i)=>i?ctx.lineTo(x/2,y/2):ctx.moveTo(x/2,y/2));ctx.stroke();
 }
 const pixels=ctx.getImageData(0,0,c.width,c.height).data;
 for(let i=0;i<pixels.length;i+=4){const filled=pixels[i+3]>127&&surfaces[i]!==5;pixels[i]=filled?1:0;pixels[i+3]=filled?255:0;}
 return pixels;
}
