export type TaskId = 'feed-chickens' | 'collect-eggs' | 'clean-coop' | 'water-crops' | 'feed-cows' | 'collect-milk';
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
    'water-crops': { id: 'water-crops', status: 'ready', lastRunAt: null, assignedTo: 'margarita' },
    'feed-cows': { id: 'feed-cows', status: 'ready', lastRunAt: null, assignedTo: null },
    'collect-milk': { id: 'collect-milk', status: 'ready', lastRunAt: null, assignedTo: null },
  },
};

export const taskCopy: Record<TaskId, { title: string; place: string; actor: string; quantity?: number }> = {
  'feed-chickens': { title: 'Alimentar pollitos', place: 'Gallinero', actor: 'Pío' },
  'collect-eggs': { title: 'Recoger huevos', place: 'Gallinero', actor: 'Pío', quantity: 4 },
  'clean-coop': { title: 'Limpiar gallinero', place: 'Gallinero', actor: 'Pío' },
  'water-crops': { title: 'Regar cultivos', place: 'Huerto', actor: 'Margarita' },
  'feed-cows': { title: 'Alimentar vacas', place: 'Establo', actor: 'Margarita' },
  'collect-milk': { title: 'Recoger leche', place: 'Establo', actor: 'Margarita', quantity: 2 },
};

export function runOfflineProgress(state: FarmState, now = Date.now()): { state: FarmState; report: OfflineReport } {
  const elapsedMs = Math.max(0, now - state.lastSeen);
  const cycles = Math.min(8, Math.floor(elapsedMs / (60 * 60 * 1000)));
  const next = structuredClone(state);
  const lines: string[] = [];
  const enabled = Object.values(next.tasks).filter(task => task.assignedTo);
  if (cycles > 0 && enabled.length) {
    for (const task of enabled) {
      const copy = taskCopy[task.id];
      lines.push(`${copy.actor} ${copy.title.toLowerCase()}.`);
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
