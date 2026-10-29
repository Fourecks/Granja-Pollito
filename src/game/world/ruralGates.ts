import { paddocks } from './ruralBuildings';
import type { Point, Polygon, NavigationGate } from '../navigation';
export interface RuralGate extends NavigationGate {a:Point;b:Point;progress:number;holdUntil:number;}
const make=(id:string,a:Point,b:Point):RuralGate=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,nx=-dy/l*2,ny=dx/l*2;const shape:Polygon=[[a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny]];return {id,a,b,shape,open:false,progress:0,holdUntil:0};};
export const ruralGates=paddocks.flatMap(p=>{const gap=p.id==='chicken'?74:64,c=p.x+p.w/2,y=p.y+p.h;const gates=[make(`${p.id}-front`,[c-gap/2,y],[c+gap/2,y])];if(p.eastGate)gates.push(make(`${p.id}-east`,[p.x+p.w,p.y],[p.x+p.w,p.y+82]));return gates;});
export const gateDistance=(p:Point,g:RuralGate)=>{const dx=g.b[0]-g.a[0],dy=g.b[1]-g.a[1],t=Math.max(0,Math.min(1,((p[0]-g.a[0])*dx+(p[1]-g.a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(p[0]-g.a[0]-t*dx,p[1]-g.a[1]-t*dy);};
export interface GateActor {kind:string;x:number;y:number;route:readonly Point[];}
function crossing(a:Point,b:Point,g:RuralGate){const dx=b[0]-a[0],dy=b[1]-a[1],ex=g.b[0]-g.a[0],ey=g.b[1]-g.a[1],den=dx*ey-dy*ex;if(Math.abs(den)<1e-7)return gateDistance(a,g)<14||gateDistance(b,g)<14;const t=((g.a[0]-a[0])*ey-(g.a[1]-a[1])*ex)/den,u=((g.a[0]-a[0])*dy-(g.a[1]-a[1])*dx)/den;return t>=0&&t<=1&&u>=0&&u<=1;}
/** Intent-aware approach, occupancy hold and a short delay prevent closing on a body. */
export function advanceGate(g:RuralGate,actors:readonly GateActor[],time:number,delta:number){
 const requested=actors.some(a=>a.kind==='worker'&&gateDistance([a.x,a.y],g)<90&&(gateDistance([a.x,a.y],g)<18||a.route.slice(0,3).some((p,i)=>crossing(i?a.route[i-1]:[a.x,a.y],p,g))));
 const occupied=g.progress>.05&&actors.some(a=>gateDistance([a.x,a.y],g)<22);
 if(requested||occupied)g.holdUntil=time+900;
 const opening=time<g.holdUntil;g.progress=Math.max(0,Math.min(1,g.progress+(opening?1:-1)*Math.min(delta,80)/280));g.open=g.progress>=.82;
}
