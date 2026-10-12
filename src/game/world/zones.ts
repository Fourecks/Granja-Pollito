import { oval, point, polygon } from './mapConfig';
import type { Point, Polygon } from '../navigation';
export interface Zone { id:string; center:Point; approach:Point; shape:Polygon; surface:'grass'|'earth'|'mud'|'soil'|'stone'|'sand'; elevation:number; legacyObject?:string }
const zone=(id:string,x:number,y:number,rx:number,ry:number,surface:Zone['surface']='grass',legacyObject?:string,elevation=0):Zone=>({id,center:point(x,y),approach:point(x,y+ry*.65),shape:oval(x,y,rx,ry,x),surface,elevation,legacyObject});
export const zones:Zone[] = [
 zone('pandaSanctuary',250,200,116,67,'grass',undefined,1),
 zone('northForest',777,75,126,65,'grass',undefined,2),
 zone('woodland',1140,168,124,87),
 zone('mixedBarnArea',608,309,124,67,'earth'),
 zone('horsePaddock',548,323,51,40,'grass'),zone('pigPaddock',673,324,49,41,'mud'),
 zone('cowArea',987,325,124,58,'grass','barn'),
 zone('chickenArea',371,431,96,49,'earth','coop',1),
 zone('centralPlaza',713,486,87,60,'stone','sign'),
 zone('cropsArea',1090,476,106,58,'soil','garden'),
 zone('greenhouseArea',1323,462,62,53,'earth','shed'),
 zone('jefeHouseArea',875,609,101,65,'grass','home',1),
 zone('sheepGoatArea',1168,637,112,68),
 zone('rabbitArea',1400,675,67,43,'earth'),
 zone('duckArea',140,598,78,43),
 zone('beach',322,884,105,15,'sand'),
 zone('lakeIsland',425,715,67,34),
 zone('fishingArea',1395,766,40,22,'sand'),
];
export const zoneById = Object.fromEntries(zones.map(z=>[z.id,z])) as Record<string,Zone>;
export const waterZonesData = [
 {id:'lake',shape:polygon([[240,570],[520,610],[550,730],[280,780]]),capabilities:['WATER']},
 {id:'fishingWater',shape:polygon([[985,850],[1536,850],[1536,1024],[985,1024]]),capabilities:['WATER','FISHING_WATER']},
];

export const FISHING_WATER=waterZonesData.find(z=>z.id==='fishingWater')!.shape;
