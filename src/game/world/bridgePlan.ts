import { bridges, type Crossing } from './mapConfig';
export type BridgeStyle='rustic'|'farm'|'large';
export interface BridgePlan {crossing:Crossing;style:BridgeStyle;length:number;width:number;ux:number;uy:number;nx:number;ny:number;postHeight:number;postSpacing:number;}
/** Exact authored walkable polygon. Art is assembled at these vectors, never rotated as one sprite. */
export function bridgePlan(crossing:Crossing):BridgePlan {
 const dx=crossing.to[0]-crossing.from[0],dy=crossing.to[1]-crossing.from[1],length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length;
 const width=Math.hypot(crossing.shape[0][0]-crossing.shape[3][0],crossing.shape[0][1]-crossing.shape[3][1]);
 const style:BridgeStyle=length>=220?'large':length<115?'rustic':'farm';
 return {crossing,style,length,width,ux,uy,nx:-uy,ny:ux,postHeight:style==='large'?32:style==='farm'?27:23,postSpacing:style==='large'?44:style==='farm'?38:34};
}
export const bridgePlans=bridges.map(bridgePlan);
export function bridgePoint(p:BridgePlan,along:number,across:number){return {x:p.crossing.from[0]+p.ux*along+p.nx*across,y:p.crossing.from[1]+p.uy*along+p.ny*across};}
