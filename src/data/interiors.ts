import { rectangle, type Point, type Polygon } from '../game/navigation';
import type { Species } from '../game/world/livestock';
import type { InteriorId } from './world';
import type { TaskId } from '../domain';
export interface CareStation { task:TaskId; label:string; point:Point; }
export interface InteriorData { id:InteriorId; title:string; asset:string; walkable:Polygon[]; obstacles:Polygon[]; stations:CareStation[]; animals:{species:Species;points:Point[]}[]; manure:Point[]; }
const clearFloor=[rectangle(340,315,990,410)];
const stations=(values:CareStation[])=>values;
export const interiors:Record<InteriorId,InteriorData>={
 home:{id:'home',title:'Casa de La Jefa',asset:'/assets/interior-home-v2.webp',walkable:[rectangle(340,320,1120,430)],obstacles:[rectangle(365,334,425,220),rectangle(1000,300,350,125)],stations:[],animals:[],manure:[]},
 coop:{id:'coop',title:'Gallinero de los pollitos',asset:'/assets/interior-coop-v2.webp',walkable:clearFloor,obstacles:[rectangle(250,300,180,300),rectangle(1240,300,185,300)],stations:stations([
  {task:'feed-chickens',label:'Dar semillas',point:[1190,515]}, {task:'collect-eggs',label:'Recoger huevos',point:[835,360]}, {task:'clean-coop',label:'Limpiar paja',point:[460,535]}, {task:'prepare-dust-bath',label:'Baño de polvo',point:[590,610]},
 ]),animals:[{species:'chicken',points:[[590,450],[680,505],[770,565],[885,515],[995,570],[1110,480],[730,635],[1030,630],[925,430],[570,585]]}],manure:[[535,570],[705,620],[870,585],[1070,535],[1165,620]]},
 barn:{id:'barn',title:'Establo de las vacas',asset:'/assets/interior-barn-v2.webp',walkable:clearFloor,obstacles:[rectangle(260,315,290,180),rectangle(1110,315,300,180)],stations:stations([
  {task:'feed-cows',label:'Servir heno',point:[1250,540]}, {task:'collect-milk',label:'Ordeñar',point:[460,540]},
 ]),animals:[{species:'cow',points:[[425,415],[1260,415]]}],manure:[[605,585],[755,620],[920,570],[1090,620]]},
 shed:{id:'shed',title:'Invernadero y almacén',asset:'/assets/interior-shed-v2.webp',walkable:[rectangle(740,380,260,380)],obstacles:[rectangle(530,405,225,200),rectangle(950,410,210,220)],stations:stations([{task:'water-crops',label:'Regar semilleros',point:[835,530]}]),animals:[],manure:[]},
 'horse-stable':{id:'horse-stable',title:'Establo de caballos',asset:'/assets/interior-horse-stable-v1.png',walkable:clearFloor,obstacles:[rectangle(180,305,330,205),rectangle(1150,305,335,205)],stations:stations([
  {task:'feed-horses',label:'Dar heno',point:[470,545]}, {task:'brush-horses',label:'Cepillar',point:[1190,545]}, {task:'wash-horses',label:'Bañar caballos',point:[600,650]}, {task:'clean-stable',label:'Limpiar boxes',point:[880,650]},
 ]),animals:[{species:'horse',points:[[360,405],[1300,405]]}],manure:[[570,575],[720,625],[920,585],[1070,630]]},
 'goat-shelter':{id:'goat-shelter',title:'Casa de las cabras',asset:'/assets/interior-goat-shelter-v1.png',walkable:clearFloor,obstacles:[rectangle(150,300,265,235),rectangle(1255,300,270,235)],stations:stations([
  {task:'feed-goats',label:'Servir heno',point:[450,545]}, {task:'groom-goats',label:'Asear cabras',point:[1190,550]}, {task:'clean-goat-shelter',label:'Limpiar corral',point:[850,660]},
 ]),animals:[{species:'goat',points:[[330,410],[1340,410],[675,570],[1030,565]]}],manure:[[500,590],[700,640],[930,610],[1130,585]]},
 'pig-shelter':{id:'pig-shelter',title:'Casa de los cerdos',asset:'/assets/interior-pig-shelter-v1.png',walkable:clearFloor,obstacles:[rectangle(90,300,400,220),rectangle(1150,300,400,220)],stations:stations([
  {task:'feed-pigs',label:'Dar comida',point:[250,555]}, {task:'mud-bath-pigs',label:'Baño de lodo',point:[1220,530]}, {task:'clean-pig-pen',label:'Limpiar corral',point:[860,665]},
 ]),animals:[{species:'pig',points:[[330,420],[1320,420],[1260,620]]}],manure:[[535,590],[735,640],[910,610],[1090,580]]},
};
