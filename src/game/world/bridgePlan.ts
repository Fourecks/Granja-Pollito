import { bridges, type Crossing } from './mapConfig';
export type BridgeStyle='rustic'|'rope'|'stone'|'arched'|'footwalk';
export interface BridgePlan {crossing:Crossing;style:BridgeStyle;length:number;width:number;ux:number;uy:number;nx:number;ny:number;postHeight:number;postSpacing:number;}
const variants:Record<string,BridgeStyle>={
 'north-bridge':'rope','plaza-bridge':'stone','panda-bridge':'rustic','duck-bridge':'rope',
 'duck-east-bridge':'rustic','lake-island-bridge':'rope','beach-island-bridge':'stone',
 'south-bridge':'stone','east-bridge':'rustic','fishing-pier':'footwalk',
};
/** Deck and navigation share the narrow path-width polygon; components keep upright perspective. */
export function bridgePlan(crossing:Crossing):BridgePlan {
 const dx=crossing.to[0]-crossing.from[0],dy=crossing.to[1]-crossing.from[1],length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length;
 const width=Math.hypot(crossing.shape[0][0]-crossing.shape[3][0],crossing.shape[0][1]-crossing.shape[3][1]);
 const style=variants[crossing.id]??'stone';
 return {crossing,style,length,width,ux,uy,nx:-uy,ny:ux,postHeight:style==='footwalk'?0:style==='stone'||style==='arched'?14:20,postSpacing:140};
}
export const bridgePlans=bridges.map(bridgePlan);
export function bridgePoint(p:BridgePlan,along:number,across:number){return {x:p.crossing.from[0]+p.ux*along+p.nx*across,y:p.crossing.from[1]+p.uy*along+p.ny*across};}
export function bridgeAtlas(p:BridgePlan){return p.style==='stone'||p.style==='arched'?'bridge-stone':'bridge-rustic';}
