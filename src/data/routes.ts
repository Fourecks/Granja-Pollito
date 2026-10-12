import type { TaskId } from '../domain';
import type { Point } from '../game/navigation';
import type { InteriorId } from './world';
export interface Worker { id: string; name: string; role: string; row: number; home: Point; path: Point[]; }
export const workers: Worker[] = [
 {id:'minnie',name:'Minnie',role:'Alimentación y cuidado',row:1,home:[255,349],path:[[255,349],[690,445],[975,625],[1285,312],[1535,508],[205,810]]},
 {id:'pollito',name:'Pollito',role:'Agua, limpieza y huerto',row:2,home:[382,346],path:[[382,346],[455,479],[970,470],[1240,547],[730,303],[600,610]]},
 {id:'kiara',name:'Kiara',role:'Huevos y ordeño',row:3,home:[330,325],path:[[330,325],[730,303],[870,440],[1285,312],[1140,584],[278,623]]},
];
export interface TaskRoute { worker: string; room: InteriorId; point: Point; interiorPoint: Point; action: string; duration: number; }
export const taskRoutes: Record<TaskId,TaskRoute> = {
 'feed-chickens':{worker:'minnie',room:'coop',point:[154,333],interiorPoint:[1280,445],action:'Sirviendo semillas',duration:2500},
 'collect-eggs':{worker:'kiara',room:'coop',point:[344,300],interiorPoint:[830,355],action:'Recogiendo huevos',duration:2400},
 'clean-coop':{worker:'pollito',room:'coop',point:[218,348],interiorPoint:[435,475],action:'Agua fresca y paja limpia',duration:2700},
 'water-crops':{worker:'pollito',room:'shed',point:[455,479],interiorPoint:[835,530],action:'Regando las hortalizas',duration:2800},
 'feed-cows':{worker:'minnie',room:'barn',point:[1285,312],interiorPoint:[1060,540],action:'Sirviendo heno',duration:2500},
 'collect-milk':{worker:'kiara',room:'barn',point:[1310,303],interiorPoint:[1070,540],action:'Ordeñando a Margarita',duration:4000},
};
