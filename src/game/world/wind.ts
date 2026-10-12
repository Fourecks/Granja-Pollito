export type WindFamily='grass'|'tallGrass'|'flowers'|'reeds'|'bamboo'|'bushes'|'canopy'|'leaves'|'petals';
export interface WindVariation {offset:number;amplitude:number;speed:number;}
const thresholds:Record<WindFamily,number>={grass:0,tallGrass:0,flowers:.28,reeds:0,bamboo:.28,bushes:.4,canopy:.65,leaves:0,petals:0};
/** World-wide wind state; radians and normalized strength (0 = still, 1 = strong). */
export class WindSystem {
 direction=0;
 strength=.18;
 variation(x:number,y:number):WindVariation {
  const seed=Math.abs(Math.sin(x*12.9898+y*78.233)*43758.5453)%1;
  return {offset:seed*Math.PI*2,amplitude:.65+seed*.55,speed:.75+(Math.abs(Math.sin(x*.31+y*.17))%1)*.5};
 }
 response(family:WindFamily,time:number,variation:WindVariation):number {
  const strength=Math.max(0,Math.min(1,this.strength));
  const amount=Math.max(0,strength-thresholds[family]);
  return amount*variation.amplitude*(.65*Math.sin(time*.001*variation.speed+variation.offset)+.35*Math.sin(time*.00053*variation.speed+variation.offset*1.7));
 }
}
