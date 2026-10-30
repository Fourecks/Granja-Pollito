export type TaskId = 'feed-chickens' | 'collect-eggs' | 'clean-coop' | 'prepare-dust-bath' | 'water-crops' | 'feed-cows' | 'collect-milk' | 'feed-goats' | 'groom-goats' | 'clean-goat-shelter' | 'feed-horses' | 'brush-horses' | 'wash-horses' | 'clean-stable' | 'feed-pigs' | 'mud-bath-pigs' | 'clean-pig-pen';
export type TaskStatus = 'ready' | 'done';
export interface FarmTask { id: TaskId; status: TaskStatus; lastRunAt: number | null; assignedTo: string | null; }
export interface FarmState { lastSeen: number; eggs: number; milk: number; cropsWatered: boolean; tasks: Record<TaskId, FarmTask>; introSeen: boolean; }
export interface OfflineReport { lines: string[]; elapsedMs: number; }

export const DEFAULT_STATE: FarmState = {
  lastSeen: Date.now(), eggs: 0, milk: 0, cropsWatered: false, introSeen: false,
  tasks: {
    'feed-chickens': { id: 'feed-chickens', status: 'ready', lastRunAt: null, assignedTo: 'pio' },
    'collect-eggs': { id: 'collect-eggs', status: 'ready', lastRunAt: null, assignedTo: null },
    'clean-coop': { id: 'clean-coop', status: 'ready', lastRunAt: null, assignedTo: null },
    'prepare-dust-bath': { id: 'prepare-dust-bath', status: 'ready', lastRunAt: null, assignedTo: null },
    'water-crops': { id: 'water-crops', status: 'ready', lastRunAt: null, assignedTo: 'margarita' },
    'feed-cows': { id: 'feed-cows', status: 'ready', lastRunAt: null, assignedTo: null },
    'collect-milk': { id: 'collect-milk', status: 'ready', lastRunAt: null, assignedTo: null },
    'feed-goats': { id: 'feed-goats', status: 'ready', lastRunAt: null, assignedTo: null },
    'groom-goats': { id: 'groom-goats', status: 'ready', lastRunAt: null, assignedTo: null },
    'clean-goat-shelter': { id: 'clean-goat-shelter', status: 'ready', lastRunAt: null, assignedTo: null },
    'feed-horses': { id: 'feed-horses', status: 'ready', lastRunAt: null, assignedTo: null },
    'brush-horses': { id: 'brush-horses', status: 'ready', lastRunAt: null, assignedTo: null },
    'wash-horses': { id: 'wash-horses', status: 'ready', lastRunAt: null, assignedTo: null },
    'clean-stable': { id: 'clean-stable', status: 'ready', lastRunAt: null, assignedTo: null },
    'feed-pigs': { id: 'feed-pigs', status: 'ready', lastRunAt: null, assignedTo: null },
    'mud-bath-pigs': { id: 'mud-bath-pigs', status: 'ready', lastRunAt: null, assignedTo: null },
    'clean-pig-pen': { id: 'clean-pig-pen', status: 'ready', lastRunAt: null, assignedTo: null },
  },
};

export const taskCopy: Record<TaskId, { title: string; place: string; actor: string; quantity?: number }> = {
  'feed-chickens': { title: 'Alimentar pollitos', place: 'Gallinero', actor: 'Pío' },
  'collect-eggs': { title: 'Recoger huevos', place: 'Gallinero', actor: 'Pío', quantity: 4 },
  'clean-coop': { title: 'Limpiar gallinero', place: 'Gallinero', actor: 'Pío' },
  'prepare-dust-bath': { title: 'Preparar baño de polvo', place: 'Gallinero', actor: 'Pío' },
  'water-crops': { title: 'Regar cultivos', place: 'Huerto', actor: 'Margarita' },
  'feed-cows': { title: 'Alimentar vacas', place: 'Establo', actor: 'Margarita' },
  'collect-milk': { title: 'Recoger leche', place: 'Establo', actor: 'Margarita', quantity: 2 },
  'feed-goats': { title: 'Dar heno a las cabras', place: 'Casa de cabras', actor: 'Minnie' },
  'groom-goats': { title: 'Cepillar las cabras', place: 'Casa de cabras', actor: 'Kiara' },
  'clean-goat-shelter': { title: 'Limpiar el corral de cabras', place: 'Casa de cabras', actor: 'Pollito' },
  'feed-horses': { title: 'Dar heno a los caballos', place: 'Establo de caballos', actor: 'Minnie' },
  'brush-horses': { title: 'Cepillar los caballos', place: 'Establo de caballos', actor: 'Kiara' },
  'wash-horses': { title: 'Bañar los caballos', place: 'Establo de caballos', actor: 'Pollito' },
  'clean-stable': { title: 'Limpiar los boxes', place: 'Establo de caballos', actor: 'Minnie' },
  'feed-pigs': { title: 'Dar comida a los cerdos', place: 'Casa de cerdos', actor: 'Minnie' },
  'mud-bath-pigs': { title: 'Preparar baño de lodo', place: 'Casa de cerdos', actor: 'Kiara' },
  'clean-pig-pen': { title: 'Limpiar el corral de cerdos', place: 'Casa de cerdos', actor: 'Pollito' },
};

/** Merge older local/Supabase saves with newly added care tasks without losing progress. */
export function normalizeFarmState(saved: Partial<FarmState> | null | undefined): FarmState {
  const rawTasks = (saved?.tasks ?? {}) as Partial<Record<TaskId, FarmTask>>;
  const tasks = { ...structuredClone(DEFAULT_STATE.tasks) };
  for (const id of Object.keys(tasks) as TaskId[]) {
    const previous = rawTasks[id];
    if (previous) tasks[id] = { ...tasks[id], ...previous, id };
  }
  return { ...structuredClone(DEFAULT_STATE), ...saved, tasks };
}

const helperNames: Record<string, string> = {
  minnie: 'Minnie', pollito: 'Pollito', kiara: 'Kiara', pio: 'Pío', lola: 'Lola', margarita: 'Margarita', canela: 'Canela', nube: 'Nube',
  miel: 'Miel', copito: 'Copito', sol: 'Sol', pipa: 'Pipa',
};

export function runOfflineProgress(state: FarmState, now = Date.now()): { state: FarmState; report: OfflineReport } {
  const elapsedMs = Math.max(0, now - state.lastSeen);
  const cycles = Math.min(8, Math.floor(elapsedMs / (60 * 60 * 1000)));
  const next = migrateWorkerNames(state);
  const lines: string[] = [];
  const enabled = Object.values(next.tasks).filter(task => task.assignedTo);
  if (cycles > 0 && enabled.length) {
    for (const task of enabled) {
      const copy = taskCopy[task.id];
      const actor = helperNames[task.assignedTo ?? ''] ?? copy.actor;
      lines.push(`${actor} ${copy.title.toLowerCase()}.`);
      task.status = 'done'; task.lastRunAt = now;
      if (task.id === 'water-crops') next.cropsWatered = true;
      if (task.id === 'collect-eggs') next.eggs += cycles * (taskCopy[task.id].quantity ?? 0);
      if (task.id === 'collect-milk') next.milk += cycles * (taskCopy[task.id].quantity ?? 0);
    }
    if (next.tasks['collect-eggs'].assignedTo) lines.push(`Se recogieron ${cycles * (taskCopy['collect-eggs'].quantity ?? 0)} huevos.`);
    if (next.tasks['collect-milk'].assignedTo) lines.push(`Se recogieron ${cycles * (taskCopy['collect-milk'].quantity ?? 0)} botellas de leche.`);
  }
  next.lastSeen = now;
  return { state: next, report: { lines: [...new Set(lines)], elapsedMs } };
}

export function performTask(state: FarmState, id: TaskId, now = Date.now()): FarmState {
  const next = structuredClone(state);
  next.tasks[id].status = 'done'; next.tasks[id].lastRunAt = now;
  if (id === 'collect-eggs') next.eggs += taskCopy[id].quantity ?? 0;
  if (id === 'collect-milk') next.milk += taskCopy[id].quantity ?? 0;
  if (id === 'water-crops') next.cropsWatered = true;
  return next;
}

export function migrateWorkerNames(state:FarmState):FarmState {
 const next=structuredClone(state);const ids:Record<string,string>={alma:'minnie',bruno:'pollito',vera:'kiara'};
 for(const task of Object.values(next.tasks))if(task.assignedTo&&ids[task.assignedTo])task.assignedTo=ids[task.assignedTo];
 return next;
}
