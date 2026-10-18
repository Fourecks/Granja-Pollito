import { MAP, roads, curve } from './mapConfig';
import type { Polygon } from '../navigation';
import { bridgePlans, bridgePoint } from './bridgePlan';
import { bridgeGeometry } from './bridgeGeometry';
import type { WorldMasks } from './terrain';
/** Rendering corrections only: historical routes, collision and parcel masks stay intact. */
export const roadTieIns:Array<{id:string;line:Polygon;width:number;destination:string}>=[
 {id:'west-shore-loop',line:curve([[192,753],[195,736],[203,721]],12),width:22,destination:'ducks-lake / west-coast'},
 {id:'forest-logging-access',line:curve([[491,52],[500,65],[503,77]],12),width:22,destination:'existing stump at (1020,153)'},
 {id:'east-coast-access',line:curve([[1507,779],[1509,790],[1510,795]],12),width:24,destination:'existing coastal sand above the cliff'},
];
export function visualRoadMask(surfaces:Uint8ClampedArray,masks?:WorldMasks){
 const c=document.createElement('canvas');c.width=MAP.width/2;c.height=MAP.height/2;
 const ctx=c.getContext('2d',{willReadFrequently:true})!;ctx.strokeStyle='#fff';ctx.lineCap='round';ctx.lineJoin='round';
 for(const road of [...roads,...roadTieIns]){
  ctx.lineWidth=road.width/2;ctx.beginPath();road.line.forEach(([x,y],i)=>i?ctx.lineTo(x/2,y/2):ctx.moveTo(x/2,y/2));ctx.stroke();
 }
 const pixels=ctx.getImageData(0,0,c.width,c.height).data;
 for(let i=0;i<pixels.length;i+=4){const filled=pixels[i+3]>127&&surfaces[i]!==5;pixels[i]=filled?1:0;pixels[i+3]=filled?255:0;}
 if(masks)for(const p of bridgePlans){
  if(p.crossing.kind==='pier')continue;
  const g=bridgeGeometry(p,masks);
  for(const [end,sign] of [[g.start,-1],[g.end,1]]){
   const corners=[bridgePoint(p,end, -p.width),bridgePoint(p,end,p.width),bridgePoint(p,end+sign*28,-p.width),bridgePoint(p,end+sign*28,p.width)];
   const left=Math.max(0,Math.floor(Math.min(...corners.map(q=>q.x))/2)),right=Math.min(c.width-1,Math.ceil(Math.max(...corners.map(q=>q.x))/2)),top=Math.max(0,Math.floor(Math.min(...corners.map(q=>q.y))/2)),bottom=Math.min(c.height-1,Math.ceil(Math.max(...corners.map(q=>q.y))/2));
   for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
    const i=(y*c.width+x)*4,dx=x*2-p.crossing.from[0],dy=y*2-p.crossing.from[1],distance=(dx*p.ux+dy*p.uy-end)*sign,across=Math.abs(dx*p.nx+dy*p.ny);
    if(distance<0||distance>26||across>p.width||masks.water[i+3]||masks.cliffs[i+3]||masks.land[i+3]<128||surfaces[i]===5)continue;
    // Last 12 world units are straight. Only that small patch hides the former bend.
    if(distance<12||across<p.width/2&&distance<20){const filled=across<=p.width/2;pixels[i]=filled?1:0;pixels[i+3]=filled?255:0;}
   }
  }
 }
 return pixels;
}
