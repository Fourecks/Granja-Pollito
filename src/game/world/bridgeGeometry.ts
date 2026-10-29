import { bridgePoint, type BridgePlan } from './bridgePlan';
import type { WorldMasks } from './terrain';
export interface BridgeGeometry {start:number;end:number;postAlong:number[];across:number;lift:number;}
/** One local coordinate system for shoreline, deck, corner posts and rope sockets. */
export function bridgeGeometry(p:BridgePlan,masks:WorldMasks):BridgeGeometry {
 let first=Infinity,last=-Infinity;
 for(let along=-12;along<=p.length+12;along+=.5){const q=bridgePoint(p,along,0),i=(Math.floor(q.y/2)*1536+Math.floor(q.x/2))*4;
  if(masks.water[i+3]>127){first=Math.min(first,along);last=Math.max(last,along);}
 }
 const pier=p.crossing.kind==='pier',landing=p.crossing.id==='duck-east-bridge'?8:p.crossing.id==='south-bridge'?10:p.crossing.id==='beach-island-bridge'?12:.5;
 const start=pier?-12:Number.isFinite(first)?Math.max(-12,first-landing):-12,end=pier?p.length+12:Number.isFinite(last)?Math.min(p.length+12,last+landing):p.length+12;
 return {start,end,postAlong:[start+1.5,end-1.5],across:p.width/2-1,lift:p.postHeight*.68};
}
export function bridgeSocket(p:BridgePlan,g:BridgeGeometry,end:number,side:number){const foot=bridgePoint(p,g.postAlong[end],side*g.across);return {foot,rope:{x:Math.round(foot.x),y:Math.round(foot.y-g.lift)}};}
