import { rectangle, type Point, type Polygon } from '../navigation';
export const fountainCenter:Point=[1426,972];
export const plazaAccess:Point=[1426,1050];
export const plazaBenches:Point[]=[[1316,931],[1476,887],[1320,1037],[1545,1040]];
export const plazaObstacles:Polygon[]=[
 Array.from({length:24},(_,i)=>{const a=i*Math.PI/12;return [1426+Math.cos(a)*42,972+Math.sin(a)*23] as Point;}),
 ...plazaBenches.map(([x,y])=>rectangle(x-27,y-8,54,14)),
];
/** Move only celebration positions occupied by the new furniture. */
export function clearPlazaPoint(p:Point):Point {
 const [x,y]=p,dx=x-1426,dy=y-972;
 if(dx*dx/(54*54)+dy*dy/(36*36)<1){const a=Math.atan2(dy/36,dx/54);return [1426+Math.cos(a)*59,972+Math.sin(a)*41];}
 const bench=plazaBenches.find(([bx,by])=>Math.abs(x-bx)<37&&Math.abs(y-by)<19);
 return bench?[x,bench[1]+25]:p;
}
