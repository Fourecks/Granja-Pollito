import { point } from '../game/world/mapConfig';
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
const roster: CharacterData[] = [
  { id: 'pio', name: 'Pío', role: 'Encargado del gallinero', kind: 'chicken', state: 'walking', position: { x: 280, y: 350 }, path: [[280, 350], [294, 350], [285, 359], [270, 353]], zone: 'gallinero', task: 'feed-chickens', responsibleFor: ['feed-chickens', 'collect-eggs', 'clean-coop'], sprite: 'actors', spriteFrame: 0, scale: 3.3, animations: ['idle', 'walk', 'peck', 'eat', 'sleep'], dialogues: ['Todo bajo control, Jefa.', 'Los huevos están contando un chiste. No lo entendí.', 'Puedo encargarme… después de esta siestita.'] },
  { id: 'lola', name: 'Lola', role: 'Inspectora de flores', kind: 'chicken', state: 'pecking', position: { x: 220, y: 360 }, path: [[220, 360], [234, 360], [225, 369], [210, 363]], zone: 'jardin', task: null, responsibleFor: ['flores'], sprite: 'actors', spriteFrame: 8, scale: 3.15, animations: ['idle', 'walk', 'peck', 'sleep'], dialogues: ['Esta flor me cae bien.', 'La ronda de picoteo va según el plan.', '¿Eso era una semilla o mi almuerzo?'] },
  { id: 'margarita', name: 'Margarita', role: 'Encargada del huerto', kind: 'cow', state: 'eating', position: { x: 1285, y: 298 }, path: [[1285, 298], [1299, 298], [1290, 307], [1275, 301]], zone: 'establo', task: null, responsibleFor: ['feed-cows', 'collect-milk'], sprite: 'margarita-pixel', scale: 1, animations: ['idle', 'eat', 'sleep'], dialogues: ['Muuuuy buen día, Jefa.', 'Las zanahorias están sedientas.', 'Sigo pensando en pasto.'] },
  { id: 'canela', name: 'Canela', role: 'Pollita exploradora', kind: 'chicken', state: 'walking', position: { x: 330, y: 370 }, path: [[330, 370], [344, 370], [335, 379], [320, 373]], zone: 'huerto', sprite: 'actors', spriteFrame: 24, scale: 3.05, animations: ['idle', 'walk', 'peck', 'sleep'], dialogues: ['¡Encontré una semilla!', 'El mundo es muy grande para estas patitas.', 'Aquí cabe una siesta perfecta.'] },
  { id: 'nube', name: 'Nube', role: 'Pollito soñador', kind: 'chicken', state: 'sleeping', position: { x: 185, y: 348 }, path: [[185, 348], [199, 348], [190, 357], [175, 351]], zone: 'bosquecito', sprite: 'actors', spriteFrame: 32, scale: 3.0, animations: ['idle', 'walk', 'sleep'], dialogues: ['Las nubes parecen montoncitos de algodón.', 'Si cierro los ojos, sigo explorando.', 'Una vuelta más y busco mi tronquito.'] },
  { id: 'miel', name: 'Miel', role: 'Guardiana del estanque', kind: 'chicken', state: 'pecking', position: { x: 1290, y: 445 }, path: [[1290,445],[1410,475],[1535,508],[1580,530],[1535,508],[1410,475]], zone: 'estanque', sprite: 'actors', spriteFrame: 40, scale: 3.1, animations: ['idle', 'walk', 'peck'], dialogues: ['El agua hace cosquillas en el pico.', 'Vi una hojita bailar.', 'El estanque guarda secretos.'] },
  { id: 'copito', name: 'Copito', role: 'Ayudante de la huerta', kind: 'chicken', state: 'walking', position: { x: 440, y: 345 }, path: [[440, 345], [454, 345], [445, 354], [430, 348]], zone: 'huerto', task: 'water-crops', responsibleFor: ['water-crops'], sprite: 'actors', spriteFrame: 48, scale: 3.0, animations: ['idle', 'walk', 'peck'], dialogues: ['La tierra está fresquita.', 'Ya casi terminamos de regar.', 'La huerta huele a domingo.'] },
  { id: 'sol', name: 'Sol', role: 'Recolector de semillas', kind: 'chicken', state: 'walking', position: { x: 380, y: 375 }, path: [[380, 375], [394, 375], [385, 384], [370, 378]], zone: 'cultivos', sprite: 'actors', spriteFrame: 56, scale: 3.1, animations: ['idle', 'walk', 'peck'], dialogues: ['Una semillita para cada quien.', 'La tierra tiene muchas historias.', 'Encontré un tesoro pequeñito.'] },
  { id: 'pipa', name: 'Pipa', role: 'Ayudante del gallinero', kind: 'chicken', state: 'eating', position: { x: 280, y: 318 }, path: [[280, 318], [294, 318], [285, 327], [270, 321]], zone: 'gallinero', sprite: 'actors', spriteFrame: 4, scale: 3.0, animations: ['idle', 'walk', 'eat', 'sleep'], dialogues: ['Ese comedero es perfecto.', 'Me toca la semilla más redondita.', 'No estoy dormida, estoy pensando.'] },
];
// Preserve identities, assignments and dialogue while remapping homes to the master plan.
const homes:Record<string,readonly [number,number]>={pio:[337,426],lola:[365,439],margarita:[987,325],canela:[1090,476],nube:[395,424],miel:[140,598],copito:[1060,491],sol:[1110,486],pipa:[351,414]};
export const characters:CharacterData[]=roster.map(c=>{const p=point(...homes[c.id]);return {...c,position:{x:p[0],y:p[1]},path:[[p[0],p[1]],[p[0]+14,p[1]+8],[p[0]-12,p[1]+8]]};});
export interface InteractiveObject { id: string; type: 'sign' | 'building' | 'plot' | 'decoration'; title: string; message: string; taskIds?: TaskId[]; }
export const objects: InteractiveObject[] = [
  { id: 'home', type: 'building', title: 'Casa de La Jefa', message: 'Parcela reservada para la Casa de La Jefa.' },
  { id: 'coop', type: 'building', title: 'Gallinero', message: 'El gallinero tiene nidos, semillas y un baño de polvo para los pollitos.', taskIds: ['feed-chickens', 'collect-eggs', 'clean-coop', 'prepare-dust-bath'] },
  { id: 'barn', type: 'building', title: 'Establo de las vacas', message: 'El establo mantiene a las vacas con heno, agua y ordeño.', taskIds: ['feed-cows', 'collect-milk'] },
  { id: 'horse-stable', type: 'building', title: 'Establo de caballos', message: 'Un establo amplio con boxes, cepillos y zona de baño para los caballos.', taskIds: ['feed-horses', 'brush-horses', 'wash-horses', 'clean-stable'] },
  { id: 'pig-shelter', type: 'building', title: 'Casa de los cerdos', message: 'Corral con comedero y baño de lodo para los cerdos.', taskIds: ['feed-pigs', 'mud-bath-pigs', 'clean-pig-pen'] },
  { id: 'goat-shelter', type: 'building', title: 'Casa de las cabras', message: 'Un rincón con heno, agua y espacio para asear a las cabras.', taskIds: ['feed-goats', 'groom-goats', 'clean-goat-shelter'] },
  { id: 'garden', type: 'plot', title: 'Huerto', message: 'Suelo agrícola preparado para la próxima fase.', taskIds: ['water-crops'] },
  { id: 'sign', type: 'sign', title: 'Granja Pollito', message: 'Propietaria: La Jefa. Productividad cuestionable, compañía excelente.' },
  { id: 'well', type: 'decoration', title: 'Pozo de agua', message: 'Agua fresca para la granja, y una pausa breve para mirar el jardín.' },
  { id: 'shed', type: 'building', title: 'Invernadero y almacén', message: 'Parcela reservada para el invernadero y almacén.' },
  { id: 'pond', type: 'decoration', title: 'Estanque de los secretos', message: 'El agua guarda el reflejo de cada tarde bonita.' },
  { id: 'bench', type: 'decoration', title: 'Banco bajo el árbol', message: 'Un rincón para descansar mientras los pollitos hacen su ronda.' },
  { id: 'secret-flower', type: 'decoration', title: 'Una flor escondida', message: 'Entre las hojas apareció una flor amarilla. Parece que estaba esperando que la encontraras.' },
];
