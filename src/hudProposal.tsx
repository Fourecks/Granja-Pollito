import {createRoot} from 'react-dom/client';
import {Egg,Milk,Leaf,ClipboardList,VolumeX,Info,Plus,Minus,Sparkles} from 'lucide-react';
import Scene from './Scene';
import {DEFAULT_STATE} from './domain';
import './hudProposal.css';
// Isolated visual proposal. No persistence, task actions or changes to the live HUD.
const state=structuredClone(DEFAULT_STATE),noop=()=>{},ready=Object.values(state.tasks).filter(t=>t.status==='ready').length;
function ChickMark(){return <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><path fill="#cba65d" d="M8 13h17v14H8zM12 8h10v6H12zM5 19h5v7H5z"/><path fill="#efd99c" d="M10 12h13v12H10zM13 9h7v4h-7z"/><path fill="#354b3c" d="M21 13h2v2h-2z"/><path fill="#bb8d48" d="M25 16h5v3h-5zM13 27h2v4h-2zM21 27h2v4h-2z"/></svg>}
function Proposal(){return <main className="proposal">
 <header className="concept-top"><div className="concept-brand"><ChickMark/><div><h1>Granja Pollito</h1><p>Un día bonito en el campo</p></div></div><p className="concept-owner">La Jefa está en casa</p><div className="concept-tools"><button title="Música" aria-label="Música"><VolumeX size={19}/></button><button title="Acerca de la granja" aria-label="Acerca de la granja"><Info size={19}/></button></div></header>
 <section className="concept-map" aria-label="Vista de la propuesta"><Scene selected={null} onSelect={noop} characters={[]} state={state} activeTasks={[]} onTaskRequest={noop} onTaskComplete={noop} onTaskError={noop} onLocation={noop}/><div className="concept-hint">Arrastra para explorar · rueda para acercar</div><div className="concept-zoom"><button aria-label="Acercar"><Plus size={19}/></button><button aria-label="Alejar"><Minus size={19}/></button></div></section>
 <footer className="concept-bottom"><div className="concept-resources"><div><Egg size={23}/><span><b>{state.eggs}</b><small>Huevos</small></span></div><div><Milk size={23}/><span><b>{state.milk}</b><small>Leche</small></span></div><div><Leaf size={23}/><span><b>{state.cropsWatered?'Regado':'Con sed'}</b><small>Cultivos</small></span></div></div><div className="concept-actions"><button className="concept-surprise"><Sparkles size={18}/>Iniciar sorpresa</button><button className="concept-tasks"><ClipboardList size={19}/>Tareas<span>{ready}</span></button></div></footer>
 </main>}
createRoot(document.getElementById('root')!).render(<Proposal/>);
