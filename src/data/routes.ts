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
 'feed-chickens':{worker:'minnie',room:'coop',point:point(325,430),interiorPoint:[1280,445],action:'Sirviendo semillas',duration:2500},
 'collect-eggs':{worker:'kiara',room:'coop',point:point(399,427),interiorPoint:[830,355],action:'Recogiendo huevos',duration:2400},
 'clean-coop':{worker:'pollito',room:'coop',point:point(360,449),interiorPoint:[435,475],action:'Agua fresca y paja limpia',duration:2700},
 'water-crops':{worker:'pollito',room:'shed',point:point(1090,495),interiorPoint:[835,530],action:'Regando las hortalizas',duration:2800},
 'feed-cows':{worker:'minnie',room:'barn',point:point(1057,366),interiorPoint:[1060,540],action:'Sirviendo heno',duration:2500},
 'collect-milk':{worker:'kiara',room:'barn',point:point(1090,364),interiorPoint:[1070,540],action:'Ordeñando a Margarita',duration:4000},
};
