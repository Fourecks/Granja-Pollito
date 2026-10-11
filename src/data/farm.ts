import type { TaskId } from '../domain';
export interface CharacterData {
  id: string; name: string; role: string; kind: 'chicken' | 'cow'; dialogues: string[];
  state?: 'idle' | 'walking' | 'pecking' | 'eating' | 'sleeping';
  position?: { x: number; y: number };
  path?: Array<[number, number]>;
  zone?: string;
  task?: TaskId | null;
  responsibleFor?: string[];
  sprite?: string;
  spriteFrame?: number;
  scale?: number;
  animations?: string[];
}
export const characters: CharacterData[] = [
  { id: 'pio', name: 'Pío', role: 'Encargado del gallinero', kind: 'chicken', state: 'walking', position: { x: 900, y: 710 }, path: [[900, 710], [1020, 700], [1080, 745], [932, 774]], zone: 'gallinero', task: 'feed-chickens', responsibleFor: ['feed-chickens', 'collect-eggs', 'clean-coop'], sprite: 'chickens', spriteFrame: 0, scale: 3.3, animations: ['idle', 'walk', 'peck', 'eat', 'sleep'], dialogues: ['Todo bajo control, Jefa.', 'Los huevos están contando un chiste. No lo entendí.', 'Puedo encargarme… después de esta siestita.'] },
  { id: 'lola', name: 'Lola', role: 'Inspectora de flores', kind: 'chicken', state: 'pecking', position: { x: 1200, y: 858 }, path: [[1200, 858], [1255, 887], [1170, 930], [1120, 890]], zone: 'jardin', task: null, responsibleFor: ['flores'], sprite: 'chickens', spriteFrame: 8, scale: 3.15, animations: ['idle', 'walk', 'peck', 'sleep'], dialogues: ['Esta flor me cae bien.', 'La ronda de picoteo va según el plan.', '¿Eso era una semilla o mi almuerzo?'] },
  { id: 'margarita', name: 'Margarita', role: 'Encargada del huerto', kind: 'cow', state: 'eating', position: { x: 1820, y: 760 }, path: [[1820, 760], [1880, 780], [1850, 820], [1775, 790]], zone: 'establo', task: null, responsibleFor: ['feed-cows', 'collect-milk'], sprite: 'margarita-pixel', scale: 1, animations: ['idle', 'eat', 'sleep'], dialogues: ['Muuuuy buen día, Jefa.', 'Las zanahorias están sedientas.', 'Sigo pensando en pasto.'] },
  { id: 'canela', name: 'Canela', role: 'Pollita exploradora', kind: 'chicken', state: 'walking', position: { x: 1320, y: 920 }, path: [[1320, 920], [1370, 960], [1300, 1000], [1250, 950]], zone: 'huerto', sprite: 'chickens', spriteFrame: 24, scale: 3.05, animations: ['idle', 'walk', 'peck', 'sleep'], dialogues: ['¡Encontré una semilla!', 'El mundo es muy grande para estas patitas.', 'Aquí cabe una siesta perfecta.'] },
  { id: 'nube', name: 'Nube', role: 'Pollito soñador', kind: 'chicken', state: 'sleeping', position: { x: 2120, y: 930 }, path: [[2120, 930], [2180, 960], [2120, 930]], zone: 'bosquecito', sprite: 'chickens', spriteFrame: 32, scale: 3.0, animations: ['idle', 'walk', 'sleep'], dialogues: ['Las nubes parecen montoncitos de algodón.', 'Si cierro los ojos, sigo explorando.', 'Una vuelta más y busco mi tronquito.'] },
  { id: 'miel', name: 'Miel', role: 'Guardiana del estanque', kind: 'chicken', state: 'pecking', position: { x: 820, y: 1420 }, path: [[820, 1420], [880, 1390], [910, 1440], [855, 1460]], zone: 'estanque', sprite: 'chickens', spriteFrame: 40, scale: 3.1, animations: ['idle', 'walk', 'peck'], dialogues: ['El agua hace cosquillas en el pico.', 'Vi una hojita bailar.', 'El estanque guarda secretos.'] },
  { id: 'copito', name: 'Copito', role: 'Ayudante de la huerta', kind: 'chicken', state: 'walking', position: { x: 1600, y: 945 }, path: [[1600, 945], [1650, 920], [1630, 985], [1560, 968]], zone: 'huerto', task: 'water-crops', responsibleFor: ['water-crops'], sprite: 'chickens', spriteFrame: 48, scale: 3.0, animations: ['idle', 'walk', 'peck'], dialogues: ['La tierra está fresquita.', 'Ya casi terminamos de regar.', 'La huerta huele a domingo.'] },
  { id: 'sol', name: 'Sol', role: 'Recolector de semillas', kind: 'chicken', state: 'walking', position: { x: 1130, y: 830 }, path: [[1130, 830], [1220, 852], [1175, 895], [1085, 860]], zone: 'cultivos', sprite: 'chickens', spriteFrame: 56, scale: 3.1, animations: ['idle', 'walk', 'peck'], dialogues: ['Una semillita para cada quien.', 'La tierra tiene muchas historias.', 'Encontré un tesoro pequeñito.'] },
  { id: 'pipa', name: 'Pipa', role: 'Ayudante del gallinero', kind: 'chicken', state: 'eating', position: { x: 1060, y: 715 }, path: [[1060, 715], [1105, 750], [1030, 776], [980, 730]], zone: 'gallinero', sprite: 'chickens', spriteFrame: 4, scale: 3.0, animations: ['idle', 'walk', 'eat', 'sleep'], dialogues: ['Ese comedero es perfecto.', 'Me toca la semilla más redondita.', 'No estoy dormida, estoy pensando.'] },
];
export interface InteractiveObject { id: string; type: 'sign' | 'building' | 'plot' | 'decoration'; title: string; message: string; taskIds?: TaskId[]; }
export const objects: InteractiveObject[] = [
  { id: 'home', type: 'building', title: 'Casa de La Jefa', message: 'Hogar dulce hogar. El café está listo y la granja te espera.' },
  { id: 'coop', type: 'building', title: 'Gallinero', message: 'El centro de operaciones emplumadas.', taskIds: ['feed-chickens', 'collect-eggs', 'clean-coop'] },
  { id: 'barn', type: 'building', title: 'Establo', message: 'Margarita supervisa el turno de las vacas.', taskIds: ['feed-cows', 'collect-milk'] },
  { id: 'garden', type: 'plot', title: 'Huerto', message: 'Filas de verduras creciendo al ritmo de las buenas alas.', taskIds: ['water-crops'] },
  { id: 'sign', type: 'sign', title: 'Granja Pollito', message: 'Propietaria: La Jefa. Productividad cuestionable, compañía excelente.' },
  { id: 'well', type: 'decoration', title: 'Pozo de agua', message: 'Agua fresca para la granja, y una pausa breve para mirar el jardín.' },
  { id: 'shed', type: 'building', title: 'Almacén de herramientas', message: 'Cajas, semillas y herramientas esperan su próxima aventura.' },
  { id: 'pond', type: 'decoration', title: 'Estanque de los secretos', message: 'El agua guarda el reflejo de cada tarde bonita.' },
  { id: 'bench', type: 'decoration', title: 'Banco bajo el árbol', message: 'Un rincón para descansar mientras los pollitos hacen su ronda.' },
  { id: 'secret-flower', type: 'decoration', title: 'Una flor escondida', message: 'Entre las hojas apareció una flor amarilla. Parece que estaba esperando que la encontraras.' },
];
