import type { TaskId } from '../domain';
import type { Point } from '../game/navigation';
import type { InteriorId } from './world';
import { zoneById } from '../game/world/zones';
import { ruralBuildings } from '../game/world/ruralBuildings';
import { plazaAccess } from '../game/world/plazaPlan';
import { point } from '../game/world/mapConfig';
export interface Worker { id: string; name: string; role: string; row: number; home: Point; path: Point[]; }
const plaza=plazaAccess;
const entry=(id:string)=>ruralBuildings.find(b=>b.id===id)!.door;
export const workers: Worker[] = [
 {id:'minnie',name:'Minnie',role:'Alimentación y cuidado',row:1,home:point(690,495),path:[plaza,zoneById.chickenArea.center,entry('cow-barn'),entry('pig-shelter'),entry('goat-shelter')]},
 {id:'pollito',name:'Pollito',role:'Agua, limpieza y huerto',row:2,home:point(730,500),path:[plaza,zoneById.cropsArea.center,zoneById.greenhouseArea.approach,entry('jefa-house'),entry('horse-stable')]},
 {id:'kiara',name:'Kiara',role:'Huevos y ordeño',row:3,home:point(718,470),path:[plaza,entry('cow-barn'),zoneById.chickenArea.center,entry('rabbit-hutch')]},
];
export interface TaskRoute { worker: string; room: InteriorId; point: Point; interiorPoint: Point; action: string; duration: number; }
export const taskRoutes: Record<TaskId,TaskRoute> = {
 'feed-rabbits':{worker:'minnie',room:'rabbit-hutch',point:entry('rabbit-hutch'),interiorPoint:[470,545],action:'Sirviendo heno y verduras',duration:2600},
 'water-rabbits':{worker:'kiara',room:'rabbit-hutch',point:entry('rabbit-hutch'),interiorPoint:[1190,545],action:'Renovando agua limpia',duration:2600},
 'clean-rabbit-hutch':{worker:'pollito',room:'rabbit-hutch',point:entry('rabbit-hutch'),interiorPoint:[850,660],action:'Limpiando la conejera',duration:3000},
 'feed-chickens':{worker:'minnie',room:'coop',point:point(325,430),interiorPoint:[1190,515],action:'Sirviendo semillas',duration:2500},
 'collect-eggs':{worker:'kiara',room:'coop',point:point(399,427),interiorPoint:[835,360],action:'Recogiendo huevos',duration:2400},
 'clean-coop':{worker:'pollito',room:'coop',point:point(360,449),interiorPoint:[460,535],action:'Agua fresca y paja limpia',duration:2700},
 'prepare-dust-bath':{worker:'pollito',room:'coop',point:point(360,449),interiorPoint:[590,610],action:'Preparando un baño de polvo',duration:2400},
 'water-crops':{worker:'pollito',room:'shed',point:point(1090,495),interiorPoint:[835,530],action:'Regando las hortalizas',duration:2800},
 'feed-cows':{worker:'minnie',room:'barn',point:point(1057,366),interiorPoint:[1250,540],action:'Sirviendo heno',duration:2500},
 'collect-milk':{worker:'kiara',room:'barn',point:point(1090,364),interiorPoint:[460,540],action:'Ordeñando a Margarita',duration:4000},
 'feed-goats':{worker:'minnie',room:'goat-shelter',point:entry('goat-shelter'),interiorPoint:[450,545],action:'Sirviendo heno a las cabras',duration:2600},
 'groom-goats':{worker:'kiara',room:'goat-shelter',point:entry('goat-shelter'),interiorPoint:[1190,550],action:'Cepillando a las cabras',duration:3000},
 'clean-goat-shelter':{worker:'pollito',room:'goat-shelter',point:entry('goat-shelter'),interiorPoint:[850,660],action:'Barriendo el corral de cabras',duration:3000},
 'feed-horses':{worker:'minnie',room:'horse-stable',point:entry('horse-stable'),interiorPoint:[470,545],action:'Sirviendo heno a los caballos',duration:2800},
 'brush-horses':{worker:'kiara',room:'horse-stable',point:entry('horse-stable'),interiorPoint:[1190,545],action:'Cepillando a los caballos',duration:3200},
 'wash-horses':{worker:'pollito',room:'horse-stable',point:entry('horse-stable'),interiorPoint:[600,650],action:'Bañando a los caballos',duration:3600},
 'clean-stable':{worker:'minnie',room:'horse-stable',point:entry('horse-stable'),interiorPoint:[880,650],action:'Limpiando los boxes',duration:3100},
 'feed-pigs':{worker:'minnie',room:'pig-shelter',point:entry('pig-shelter'),interiorPoint:[250,555],action:'Sirviendo comida a los cerdos',duration:2600},
 'mud-bath-pigs':{worker:'kiara',room:'pig-shelter',point:entry('pig-shelter'),interiorPoint:[1220,530],action:'Preparando el baño de lodo',duration:3000},
 'clean-pig-pen':{worker:'pollito',room:'pig-shelter',point:entry('pig-shelter'),interiorPoint:[860,665],action:'Limpiando el corral de los cerdos',duration:3000},
};
