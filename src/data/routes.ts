import type { TaskId } from '../domain';
import type { Point } from '../game/navigation';
import type { InteriorId } from './world';
export interface Worker { id: string; name: string; role: string; row: number; home: Point; path: Point[]; }
export const workers: Worker[] = [
 {id:'alma',name:'Alma',role:'Alimentación y cuidado',row:1,home:[255,349],path:[[255,349],[180,330],[220,370]]},
 {id:'bruno',name:'Bruno',role:'Agua, limpieza y huerto',row:2,home:[382,346],path:[[382,346],[425,333],[360,373]]},
 {id:'vera',name:'Vera',role:'Huevos y ordeño',row:3,home:[330,325],path:[[330,325],[302,353],[395,356]]},
];
export interface TaskRoute { worker: string; room: InteriorId; point: Point; interiorPoint: Point; action: string; duration: number; }
export const taskRoutes: Record<TaskId,TaskRoute> = {
 'feed-chickens':{worker:'alma',room:'coop',point:[154,333],interiorPoint:[1280,445],action:'Sirviendo semillas',duration:2500},
 'collect-eggs':{worker:'vera',room:'coop',point:[344,300],interiorPoint:[830,355],action:'Recogiendo huevos',duration:2400},
 'clean-coop':{worker:'bruno',room:'coop',point:[218,348],interiorPoint:[435,475],action:'Agua fresca y paja limpia',duration:2700},
 'water-crops':{worker:'bruno',room:'shed',point:[455,479],interiorPoint:[835,530],action:'Regando las hortalizas',duration:2800},
 'feed-cows':{worker:'alma',room:'barn',point:[1285,312],interiorPoint:[1060,540],action:'Sirviendo heno',duration:2500},
 'collect-milk':{worker:'vera',room:'barn',point:[1310,303],interiorPoint:[1070,540],action:'Ordeñando a Margarita',duration:4000},
};
