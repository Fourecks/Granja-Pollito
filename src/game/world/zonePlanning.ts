import { roads, oval } from './mapConfig';
import { zoneById } from './zones';
import type { Point, Polygon } from '../navigation';
export interface PlannedZone {id:string;name:string;area:Polygon;center:Point;kind:'building'|'habitat'|'field'|'plaza';footprint?:{width:number;depth:number};door?:Point;road?:string;note:string}
const plan=(id:string,name:string,zoneId:string,x:number,y:number,kind:PlannedZone['kind'],width=0,depth=0,road='',note=''):PlannedZone=>({id,name,area:zoneById[zoneId].shape,center:[x*2,y*2],kind,footprint:width?{width,depth}:undefined,door:width?[x*2,y*2+depth/2]:undefined,road:road||undefined,note});
// Area assignments follow the annotated production map. Dimensions are ground
// footprints; buildings, yard materials and access lanes share this registry.
export const zonePlanning:PlannedZone[]=[
 plan('panda-habitat','Pandas','pandaSanctuary',250,200,'habitat',0,0,'','Conservar el bambusal; sin edificio.'),
 plan('resource-yard','Madera y piedras','northForest',832,96,'building',136,60,'resource-entry','Cobertizo pequeño; auditar troncos y piedras locales.'),
 plan('horse-stable','Caballos','horsePaddock',547,288,'building',166,68,'stable-entry','Establo al norte; reservar el resto como corral.'),
 plan('pig-shelter','Cerdos','pigPaddock',680,292,'building',144,60,'pig-entry','Dependencia menor; conservar barro y patio.'),
 plan('chicken-coop','Gallinero','chickenArea',365,403,'building',160,64,'chicken-entry','Gallinero al norte del acceso; patio alrededor.'),
 plan('cow-barn','Vacas','cowArea',1070,318,'building',176,80,'cow-entry','Establo y patio en el claro sobre los cultivos.'),
 plan('goat-shelter','Refugio de cabras','duckArea',159,647,'building',104,48,'goat-entry','Refugio pequeño al oeste del lago.'),
 plan('rabbit-hutch','Refugio de conejos','rabbitArea',1342,683,'building',110,50,'rabbit-entry','Refugio bajo con madrigueras antes de pesca.'),
 plan('central-plaza','Plaza','centralPlaza',713,486,'plaza',0,0,'','Espacio abierto; sin edificio.'),
 plan('crop-fields','Cultivos','cropsArea',1090,476,'field',0,0,'','Campo exclusivamente agrícola; sin granero.'),
 plan('greenhouse','Invernadero','greenhouseArea',1323,460,'building',164,140,'greenhouse-entry','Vidrio y plantas; acceso frontal futuro.'),
 {...plan('jefa-house','Casa de la Jefa','jefeHouseArea',875,593,'building',180,60,'jefa-house-entry','Casa existente; conservar jardín y barranco.'),door:[1750,1216]},
 {...plan('goat-habitat','Cabras','duckArea',140,620,'habitat',0,0,'','Ubicación de la imagen: oeste del lago. No usar sheepGoatArea.'),area:oval(140,620,55,50)},
 plan('rabbit-habitat','Conejos','rabbitArea',1400,675,'habitat',0,0,'','Madrigueras y troncos; sin casa principal.'),
 plan('fishing-hut','Pesca','fishingArea',1353,765,'building',80,44,'fishing-hut-entry','Caseta junto al acceso superior al muelle; mantener gradas.'),
];
export function roadConnection(p:PlannedZone):Point|undefined{
 const r=roads.find(r=>r.id===p.road);if(!r||!p.door)return;
 let best:Point=r.line[0],distance=Infinity;
 for(let i=1;i<r.line.length;i++){const a=r.line[i-1],b=r.line[i],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p.door[0]-a[0])*dx+(p.door[1]-a[1])*dy)/(dx*dx+dy*dy||1)));const q:Point=[Math.round(a[0]+dx*t),Math.round(a[1]+dy*t)],d=Math.hypot(q[0]-p.door[0],q[1]-p.door[1]);if(d<distance){best=q;distance=d;}}
 return best;
}
