import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, ClipboardList, Egg, House, Info, Leaf, Milk, Minus, Plus, Sparkles, X } from 'lucide-react';
import Scene from './Scene';
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
  const [workingId, setWorkingId] = useState<TaskId | null>(null);
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
    if (workingId || state.tasks[id].status === 'done') return;
    setWorkingId(id);
    setNotice(`${state.tasks[id].assignedTo ? taskCopy[id].actor : 'La Jefa'} va en camino…`);
    window.setTimeout(() => {
      setState(current => ({ ...performTask(current, id), lastSeen: Date.now() }));
      setWorkingId(null);
      setNotice(`${taskCopy[id].title}: listo. Todo bajo control, Jefa.`);
      window.setTimeout(() => setNotice(''), 2600);
    }, 1400);
  }, [state.tasks, workingId]);

  const start = () => { setEntered(true); setState(current => ({ ...current, introSeen: true, lastSeen: Date.now() })); };
  const choose = (id: string) => { setSelected(id); if (id === 'pio' && workingId) setNotice('Pío está ocupado con su ronda. ¡Qué profesional!'); };
  const activeObject = objects.find(item => item.id === selected);
  const activeCharacter = characters.find(item => item.id === selected);
  const workingCharacter = workingId ? state.tasks[workingId].assignedTo : null;
  const characterLine = activeCharacter ? activeCharacter.dialogues[(dialogueTurn[activeCharacter.id] ?? 0) % activeCharacter.dialogues.length] : '';
  const assign = (id: TaskId, value: string) => setState(current => ({ ...current, tasks: { ...current.tasks, [id]: { ...current.tasks[id], assignedTo: value || null, status: value ? current.tasks[id].status : 'ready' } } }));

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark">🐥</div><div><strong>Granja Pollito</strong><span>Un día bonito en el campo</span></div></div>
      <div className="topbar-right"><span className="owner-chip"><span className="online-dot"/> La Jefa está en casa</span><button className="icon-button" title="Acerca de la granja" onClick={() => setSelected('sign')}><Info size={18}/></button></div>
    </header>
    <section className="farm-wrap" aria-label="Granja Pollito interactiva">
      <div className="sky-haze haze-one"/><div className="sky-haze haze-two"/>
      <Scene selected={selected} onSelect={choose} characters={characters} workingCharacter={workingCharacter} onZoom={zoomBy}/>
      <div className="map-hint"><span className="mouse-icon">⌖</span> Arrastra para explorar <span className="hint-separator">·</span> rueda para acercar</div>
      <div className="zoom-controls"><button onClick={() => zoomBy(-100)} aria-label="Acercar"><Plus size={17}/></button><button onClick={() => zoomBy(100)} aria-label="Alejar"><Minus size={17}/></button></div>
      <div className="farm-weather"><span>☀️</span> <div><strong>Un día tranquilo</strong><small>Los pollitos andan de buen humor</small></div></div>
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
      <p className="eyebrow">{activeCharacter ? activeCharacter.role : activeObject?.type === 'building' ? 'RINCÓN DE LA GRANJA' : activeObject?.type === 'plot' ? 'HUERTO' : 'UN MENSAJE PARA TI'}</p>
      <h2>{activeCharacter?.name ?? activeObject?.title ?? (selected === 'well' ? 'Pozo de agua' : 'Un rincón especial')}</h2>
      <p className="panel-description">{activeCharacter ? `“${characterLine}”` : activeObject?.message ?? 'Un pequeño detalle que hace más bonita la granja.'}</p>
      {activeObject?.taskIds && <div className="panel-tasks">{activeObject.taskIds.map(id => <TaskRow key={id} id={id} state={state} onRun={runTask} onAssign={assign} disabled={!!workingId}/>)}</div>}
      {activeCharacter && <button className="secondary-button" onClick={() => { setNotice(characterLine); setDialogueTurn(current => ({ ...current, [activeCharacter.id]: (current[activeCharacter.id] ?? 0) + 1 })); }}>Hablar un poquito <ArrowUpRight size={15}/></button>}
      {selected === 'well' && <span className="quiet-note">Agua fresca, cortesía de la granja.</span>}
    </div>}

    {selected === 'tasks' && <div className="task-drawer"><div className="drawer-heading"><div><p className="eyebrow">EL DÍA A DÍA</p><h2>Cuidados de la granja</h2></div><button className="close-button" onClick={() => setSelected(null)} aria-label="Cerrar"><X size={18}/></button></div><p className="drawer-intro">La Jefa puede encargarse o dejar el trabajo en buenas alas.</p>{Object.keys(state.tasks).map(id => <TaskRow key={id} id={id as TaskId} state={state} onRun={runTask} onAssign={assign} disabled={!!workingId}/>)}<div className="drawer-foot"><House size={15}/> Un paso a la vez. La granja te lo agradece.</div></div>}
  </main>;
}

function TaskRow({ id, state, onRun, onAssign, disabled }: { id: TaskId; state: FarmState; onRun: (id: TaskId) => void; onAssign: (id: TaskId, value: string) => void; disabled: boolean }) {
  const task = state.tasks[id]; const data = taskCopy[id]; const done = task.status === 'done';
  return <div className={`task-row ${done ? 'task-done' : ''}`}><div className="task-row-copy"><span className="task-check">{done ? '✓' : '·'}</span><div><strong>{data.title}</strong><small>{data.place}{done ? ' · Hecho' : ''}</small></div></div><div className="task-row-actions"><select aria-label={`Encargado: ${data.title}`} value={task.assignedTo ?? ''} onChange={e => onAssign(id, e.target.value)}><option value="">Nadie</option><option value="pio">Pío</option><option value="lola">Lola</option><option value="margarita">Margarita</option></select><button className="task-action" disabled={done || disabled} onClick={() => onRun(id)}>{done ? 'Listo' : task.assignedTo ? 'Enviar' : 'Hacer'}</button></div></div>;
}
