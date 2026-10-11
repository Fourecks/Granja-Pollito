import type { TaskId } from '../domain';
export interface CharacterData { id: string; name: string; role: string; kind: 'chicken' | 'cow'; dialogues: string[]; }
export const characters: CharacterData[] = [
  { id: 'pio', name: 'Pío', role: 'Encargado del gallinero', kind: 'chicken', dialogues: ['Todo bajo control, Jefa.', 'Los huevos están contando un chiste. No lo entendí.', 'Puedo encargarme… después de esta siestita.'] },
  { id: 'lola', name: 'Lola', role: 'Inspectora de flores', kind: 'chicken', dialogues: ['Esta flor me cae bien.', 'La ronda de picoteo va según el plan.', '¿Eso era una semilla o mi almuerzo?'] },
  { id: 'margarita', name: 'Margarita', role: 'Encargada del huerto', kind: 'cow', dialogues: ['Muuuuy buen día, Jefa.', 'Las zanahorias están sedientas.', 'Sigo pensando en pasto.'] },
];
export interface InteractiveObject { id: string; type: 'sign' | 'building' | 'plot'; title: string; message: string; taskIds?: TaskId[]; }
export const objects: InteractiveObject[] = [
  { id: 'home', type: 'building', title: 'Casa de La Jefa', message: 'Hogar dulce hogar. El café está listo y la granja te espera.' },
  { id: 'coop', type: 'building', title: 'Gallinero', message: 'El centro de operaciones emplumadas.', taskIds: ['feed-chickens', 'collect-eggs', 'clean-coop'] },
  { id: 'barn', type: 'building', title: 'Establo', message: 'Margarita supervisa el turno de las vacas.', taskIds: ['feed-cows', 'collect-milk'] },
  { id: 'garden', type: 'plot', title: 'Huerto', message: 'Un pequeño rincón que pronto estará lleno de verduras.', taskIds: ['water-crops'] },
  { id: 'sign', type: 'sign', title: 'Granja Pollito', message: 'Propietaria: La Jefa. Productividad cuestionable, compañía excelente.' },
];
