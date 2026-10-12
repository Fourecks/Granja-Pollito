import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, ClipboardList, Egg, House, Info, Leaf, Milk, Minus, Plus, Sparkles, X } from 'lucide-react';
import BackgroundMusic from './BackgroundMusic';
const Scene = lazy(() => import('./Scene'));
import { CELEBRATION_MODE, celebrationMessages, celebrationEntities } from './data/celebration';
import { workers, taskRoutes } from './data/routes';
import { interiors } from './data/interiors';
import type { InteriorId } from './data/world';
import { characters, objects } from './data/farm';
import { DEFAULT_STATE, performTask, runOfflineProgress, taskCopy, type FarmState, type TaskId } from './domain';
import { farmRepository } from './repository';

const objectGlyph: Record<string, string> = { home: '⌂', coop: '♧', barn: '♧', garden: '❀', sign: '✳', well: '◉', pio: '🐤', lola: '🐥', margarita: '🐄' };

export default function App() {
  const [state, setState] = useState<FarmState>(structuredClone(DEFAULT_STATE));
  const [ready, setReady] = useState(false);
  const [entered, setEntered] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [report, setReport] = useState<string[]>([]);
  const [workingIds, setWorkingIds] = useState<TaskId[]>([]);
  const [location, setLocation] = useState<InteriorId | null>(null);
  const [celebrationPhase,setCelebrationPhase]=useState('idle');
  const [notice, setNotice] = useState('');
  const [dialogueTurn, setDialogueTurn] = useState<Record<string, number>>({});
  const zoomBy = (delta: number) => window.dispatchEvent(new CustomEvent('farm-zoom', { detail: delta }));

  useEffect(() => {
    let active = true;
    farmRepository.load().then(saved => {
      const progress = runOfflineProgress(saved);
      if (active) { setState(progress.state); setReport(progress.report.lines); setEntered(progress.state.introSeen); setReady(true); }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => { if (ready) { const timer = window.setTimeout(() => { void farmRepository.save(state); }, 250); return () => window.clearTimeout(timer); } }, [state, ready]);
  useEffect(() => {
    if (!ready || !entered || state.tasks['feed-chickens'].status !== 'ready' || !state.tasks['feed-chickens'].assignedTo) return;
    const timer = window.setTimeout(() => runTask('feed-chickens'), 2200);
    return () => window.clearTimeout(timer);
    // The first visit shows the automatic caretaker doing their job once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, entered]);

  const runTask = useCallback((id: TaskId) => {
    if (workingIds.includes(id) || state.tasks[id].status === 'done') return;
    setWorkingIds(current => [...current, id]);
    const worker = workers.find(w => w.id === state.tasks[id].assignedTo) ?? workers.find(w => w.id === taskRoutes[id].worker)!;
    setNotice(`${worker.name} va en camino: ${taskCopy[id].title.toLowerCase()}.`);
  }, [state.tasks, workingIds]);
  const completeTask = useCallback((id: TaskId) => {
    setState(current => ({ ...performTask(current, id), lastSeen: Date.now() }));
    setWorkingIds(current => current.filter(task => task !== id));
    setNotice(`${taskCopy[id].title}: listo. Todo bajo control, Jefa.`);
  }, []);
  const taskError = useCallback((id: TaskId, message: string) => {
    setWorkingIds(current => current.filter(task => task !== id)); setNotice(message);
  }, []);
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(''), 6000); return () => window.clearTimeout(timer); }, [notice]);

  useEffect(()=>{const request=()=>setSelected('surprise-launcher');const status=(event:Event)=>setCelebrationPhase((event as CustomEvent<string>).detail);window.addEventListener('farm-surprise-request',request);window.addEventListener('farm-celebration-status',status);return()=>{window.removeEventListener('farm-surprise-request',request);window.removeEventListener('farm-celebration-status',status);};},[]);
  const start = () => { setEntered(true); setState(current => ({ ...current, introSeen: true, lastSeen: Date.now() })); };
  const choose = (id: string) => setSelected(id || null);
  const activeDecoration=celebrationEntities.find(e=>e.id===selected);
  const activeMessage=celebrationMessages.find(m=>m.id===selected);
  const petName=selected==='chispa'?'Chispa':selected==='nube-dog'?'Nube':null;
  const startSurprise=()=>{setSelected(null);window.dispatchEvent(new Event('farm-surprise'));};
  const activeObject = objects.find(item => item.id === selected);
  const activeCharacter = characters.find(item => item.id === selected);
  const activeWorker = workers.find(worker => worker.id === selected);
  const characterLine = activeCharacter ? activeCharacter.dialogues[(dialogueTurn[activeCharacter.id] ?? 0) % activeCharacter.dialogues.length] : '';
  const assign = (id: TaskId, value: string) => setState(current => ({ ...current, tasks: { ...current.tasks, [id]: { ...current.tasks[id], assignedTo: value || null, status: value ? current.tasks[id].status : 'ready' } } }));

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark">🐥</div><div><strong>Granja Pollito</strong><span>Un día bonito en el campo</span></div></div>
      <div className="topbar-right"><BackgroundMusic/><span className="owner-chip"><span className="online-dot"/> La Jefa está en casa</span><button className="icon-button" title="Acerca de la granja" onClick={() => setSelected('sign')}><Info size={18}/></button></div>
    </header>
    <section className="farm-wrap" aria-label="Granja Pollito interactiva">

      <Suspense fallback={<div className="world-loading"><span>🐥</span><small>Preparando Granja Pollito…</small></div>}><Scene selected={selected} onSelect={choose} characters={characters} state={state} activeTasks={workingIds} onTaskComplete={completeTask} onTaskError={taskError} onLocation={setLocation}/></Suspense>
      <div className="map-hint"><span className="mouse-icon">⌖</span> Arrastra para explorar <span className="hint-separator">·</span> rueda para acercar</div>
      <div className="zoom-controls"><button onClick={() => zoomBy(-100)} aria-label="Acercar"><Plus size={17}/></button><button onClick={() => zoomBy(100)} aria-label="Alejar"><Minus size={17}/></button></div>
      {location && <div className="room-heading"><span>{interiors[location].title}</span><button className="secondary-button" onClick={() => { setSelected(null); window.dispatchEvent(new Event('farm-exit')); }}>← Salir al exterior</button></div>}
      {CELEBRATION_MODE&&!location&&entered&&<button className="surprise-button" onClick={startSurprise} disabled={celebrationPhase!=='idle'}>{celebrationPhase==='idle'?'🎆 Iniciar sorpresa':celebrationPhase==='gathering'?'🐥 Todos vienen a la plaza…':'✨ Celebramos contigo'}</button>}
      {notice && <div className="toast"><Sparkles size={15}/>{notice}</div>}
    </section>
    <footer className="bottom-bar">
      <div className="resources"><span><Egg size={17}/><b>{state.eggs}</b> huevos</span><i/><span><Milk size={17}/><b>{state.milk}</b> leche</span><i/><span><Leaf size={17}/><b>{state.cropsWatered ? 'Regado' : 'Con sed'}</b></span></div>
      <button className="task-launch" onClick={() => setSelected(selected === 'tasks' ? null : 'tasks')}><ClipboardList size={18}/> Tareas <span className="task-count">{Object.values(state.tasks).filter(task => task.status === 'ready').length}</span></button>
    </footer>

    {!entered && <div className="welcome-overlay"><div className="welcome-card"><div className="welcome-art"><span className="welcome-sun">☀</span><span className="welcome-chick">🐥</span><span className="welcome-flower">✿</span></div><p className="eyebrow">BIENVENIDA A CASA</p><h1>Granja Pollito</h1><p className="welcome-subtitle">Un rinconcito del campo, con mucho corazón.</p><div className="welcome-rule"/><p className="welcome-copy">Una pequeña granja necesita una jefa con buen ojo… y los pollitos necesitan que alguien los mantenga bajo control.</p><div className="owner-note"><span>✦</span> Propietaria: <b>La Jefa</b></div><button className="primary-button" onClick={start}>Entrar a la granja <ArrowUpRight size={17}/></button></div></div>}

    {report.length > 0 && entered && <div className="modal-scrim" onClick={() => setReport([])}><section className="report-card" onClick={e => e.stopPropagation()}><button className="close-button" onClick={() => setReport([])} aria-label="Cerrar"><X size={18}/></button><div className="report-icon">🐥</div><p className="eyebrow">MIENTRAS NO ESTABAS</p><h2>Reporte de la granja</h2><div className="report-list">{report.map(line => <div key={line}><span>✓</span>{line}</div>)}</div><p className="report-ending">Todo bajo control, Jefa.</p><button className="primary-button" onClick={() => setReport([])}>¡Qué bien! <ArrowUpRight size={17}/></button></section></div>}

    {selected && selected !== 'tasks' && <div className="detail-panel">
      <button className="close-button" onClick={() => setSelected(null)} aria-label="Cerrar"><X size={17}/></button>
      <div className="panel-icon">{objectGlyph[selected] ?? '✿'}</div>
      <p className="eyebrow">{activeCharacter ? activeCharacter.role : activeWorker ? activeWorker.role : activeObject?.type === 'building' ? 'RINCÓN DE LA GRANJA' : activeObject?.type === 'plot' ? 'HUERTO' : 'UN MENSAJE PARA TI'}</p>
      <h2>{activeCharacter?.name ?? activeWorker?.name ?? activeObject?.title ?? petName ?? (activeMessage?'Un mensaje para ti':selected==='surprise-launcher'?'Una sorpresa en la plaza':selected === 'well' ? 'Pozo de agua' : 'Un rincón especial')}</h2>
      <p className="panel-description">{activeCharacter ? `“${characterLine}”` : activeWorker ? `${activeWorker.name} se ocupa de ${activeWorker.role.toLowerCase()}. Las tareas se completan al terminar su recorrido y trabajo.` : activeMessage?.text ?? (petName?'Un paseo, una siesta y un poquito de compañía.':selected==='surprise-launcher'?'Reunamos a la granja para celebrar a Pollito.':activeObject?.message ?? (activeDecoration?.id==='cake-table'?'Un pastel preparado con cariño para Pollito.':activeDecoration?.id==='ldc-tools'?'Pequeños recuerdos del esfuerzo y trabajo en equipo.':activeDecoration?.id==='gifts'?'La granja celebra contigo.':activeDecoration?.interaction?.text)) ?? 'Un pequeño detalle que hace más bonita la granja.'}</p>
      {activeObject?.type === 'building' && <button className="primary-button enter-building" onClick={() => { setSelected(null); window.dispatchEvent(new CustomEvent('farm-enter', { detail: activeObject.id })); }}>Entrar <ArrowUpRight size={16}/></button>}
      {activeObject?.taskIds && <div className="panel-tasks">{activeObject.taskIds.map(id => <TaskRow key={id} id={id} state={state} onRun={runTask} onAssign={assign} disabled={workingIds.includes(id)}/>)}</div>}
      {activeCharacter && <button className="secondary-button" onClick={() => { setNotice(characterLine); setDialogueTurn(current => ({ ...current, [activeCharacter.id]: (current[activeCharacter.id] ?? 0) + 1 })); }}>Hablar un poquito <ArrowUpRight size={15}/></button>}
      {selected==='surprise-launcher'&&<button className="primary-button" onClick={startSurprise} disabled={celebrationPhase!=='idle'}>🎆 Iniciar sorpresa</button>}
      {selected === 'well' && <span className="quiet-note">Agua fresca, cortesía de la granja.</span>}
    </div>}

    {selected === 'tasks' && <div className="task-drawer"><div className="drawer-heading"><div><p className="eyebrow">EL DÍA A DÍA</p><h2>Cuidados de la granja</h2></div><button className="close-button" onClick={() => setSelected(null)} aria-label="Cerrar"><X size={18}/></button></div><p className="drawer-intro">La Jefa puede encargarse o dejar el trabajo en buenas alas.</p>{Object.keys(state.tasks).map(id => <TaskRow key={id} id={id as TaskId} state={state} onRun={runTask} onAssign={assign} disabled={workingIds.includes(id as TaskId)}/>)}<div className="drawer-foot"><House size={15}/> Un paso a la vez. La granja te lo agradece.</div></div>}
  </main>;
}

function TaskRow({ id, state, onRun, onAssign, disabled }: { id: TaskId; state: FarmState; onRun: (id: TaskId) => void; onAssign: (id: TaskId, value: string) => void; disabled: boolean }) {
  const task = state.tasks[id]; const data = taskCopy[id]; const done = task.status === 'done';
  return <div className={`task-row ${done ? 'task-done' : ''}`}><div className="task-row-copy"><span className="task-check">{done ? '✓' : '·'}</span><div><strong>{data.title}</strong><small>{data.place}{done ? ' · Hecho' : ''}</small></div></div><div className="task-row-actions"><select disabled={disabled} aria-label={`Encargado: ${data.title}`} value={task.assignedTo ?? ''} onChange={e => onAssign(id, e.target.value)}><option value="">Nadie</option>{workers.map(worker => <option key={worker.id} value={worker.id}>{worker.name} · {worker.role}</option>)}{characters.map(character => <option key={character.id} value={character.id}>{character.name}</option>)}</select><button className="task-action" disabled={done || disabled} onClick={() => onRun(id)}>{done ? 'Listo' : disabled ? 'En curso' : task.assignedTo ? 'Enviar' : 'Hacer'}</button></div></div>;
}
