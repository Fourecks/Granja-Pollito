import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent, TouchEvent, WheelEvent } from 'react';
import type { CharacterData } from './data/farm';

interface Props { selected: string | null; onSelect: (id: string) => void; characters: CharacterData[]; workingCharacter: string | null; onZoom: (delta: number) => void; }
interface Camera { x: number; y: number; zoom: number; }
const W = 1100, H = 760;

export default function Scene({ selected, onSelect, workingCharacter, onZoom }: Props) {
  const [camera, setCamera] = useState<Camera>(() => ({ x: 0, y: 0, zoom: window.innerWidth < 760 ? 1.45 : 1 }));
  const [viewport, setViewport] = useState({ width: W, height: H });
  const pointer = useRef<{ id: number; x: number; y: number; startX: number; startY: number; dragged: boolean; vx: number; vy: number; target: Element } | null>(null);
  const pinchDistance = useRef<number | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!svg.current) return;
    const observer = new ResizeObserver(([entry]) => setViewport({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(svg.current); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const zoom = (event: Event) => { const delta = (event as CustomEvent<number>).detail; setCamera(c => ({ ...c, zoom: Math.max(.82, Math.min(1.65, c.zoom * (delta < 0 ? 1.08 : .92))) })); };
    window.addEventListener('farm-zoom', zoom); return () => window.removeEventListener('farm-zoom', zoom);
  }, []);
  const vb = useMemo(() => {
    const aspect = viewport.width / viewport.height;
    const baseHeight = Math.max(H, W / aspect);
    const height = baseHeight / camera.zoom, width = height * aspect;
    const x = Math.max(Math.min(0, W - width), Math.min(Math.max(0, W - width), (W - width) / 2 + camera.x));
    const y = Math.max(Math.min(0, H - height), Math.min(Math.max(0, H - height), (H - height) / 2 + camera.y));
    return `${x} ${y} ${width} ${height}`;
  }, [camera, viewport]);
  const wheel = (e: WheelEvent<SVGSVGElement>) => { e.preventDefault(); onZoom(e.deltaY); };
  const down = (e: PointerEvent<SVGSVGElement>) => { if (e.button !== 0) return; pointer.current = { id: e.pointerId, x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, dragged: false, vx: 0, vy: 0, target: e.target as Element }; e.currentTarget.setPointerCapture(e.pointerId); };
  const move = (e: PointerEvent<SVGSVGElement>) => { const p = pointer.current; if (!p || p.id !== e.pointerId || pinchDistance.current !== null) return; const dx = e.clientX - p.x, dy = e.clientY - p.y; if (Math.abs(e.clientX - p.startX) + Math.abs(e.clientY - p.startY) > 6) p.dragged = true; p.x = e.clientX; p.y = e.clientY; if (p.dragged && svg.current) { const rect = svg.current.getBoundingClientRect(); const aspect = rect.width / rect.height, viewHeight = Math.max(H, W / aspect) / camera.zoom, viewWidth = viewHeight * aspect; p.vx = -dx / rect.width * viewWidth; p.vy = -dy / rect.height * viewHeight; setCamera(c => ({ ...c, x: c.x + p.vx, y: c.y + p.vy })); } };
  const up = (_e: PointerEvent<SVGSVGElement>) => { if (!pointer.current) return; const p = pointer.current; const wasDrag = p.dragged; pointer.current = null; if (wasDrag) { let vx = p.vx * 4, vy = p.vy * 4; const coast = () => { if (Math.abs(vx) + Math.abs(vy) < .2) return; setCamera(c => ({ ...c, x: c.x + vx, y: c.y + vy })); vx *= .84; vy *= .84; requestAnimationFrame(coast); }; requestAnimationFrame(coast); } else { const target = p.target.closest('[data-pick]'); if (target) onSelect(target.getAttribute('data-pick')!); } };
  const pick = (id: string, extra = '') => ({ 'data-pick': id, className: `pickable ${selected === id ? 'chosen' : ''} ${extra}` });
  const touchStart = (e: TouchEvent<SVGSVGElement>) => { if (e.touches.length === 2) { const [a,b] = Array.from(e.touches); pinchDistance.current = Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY); if (pointer.current) pointer.current.dragged = true; } };
  const touchMove = (e: TouchEvent<SVGSVGElement>) => { if (e.touches.length !== 2 || pinchDistance.current === null) return; e.preventDefault(); const [a,b] = Array.from(e.touches); const next = Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY); const factor = next / pinchDistance.current; pinchDistance.current = next; setCamera(c => ({ ...c, zoom: Math.max(.82, Math.min(1.65, c.zoom * factor)) })); };
  const touchEnd = (e: TouchEvent<SVGSVGElement>) => { if (e.touches.length < 2) pinchDistance.current = null; };
  return <svg ref={svg} className="farm-scene" viewBox={vb} onWheel={wheel} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onTouchStart={touchStart} onTouchMove={touchMove} onTouchEnd={touchEnd} role="img" aria-label="Granja isométrica explorable">
    <defs>
      <linearGradient id="grass" x2="0" y2="1"><stop stopColor="#b8d991"/><stop offset="1" stopColor="#8dbb73"/></linearGradient>
      <linearGradient id="roof" x2="0" y2="1"><stop stopColor="#d88663"/><stop offset="1" stopColor="#b65c4b"/></linearGradient>
      <filter id="shadow" x="-40%" y="-40%" width="180%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
      <pattern id="field" width="24" height="18" patternUnits="userSpaceOnUse"><path d="M0 15 Q12 4 24 15" fill="none" stroke="#83a861" strokeWidth="2" opacity=".56"/></pattern>
    </defs>
    <rect width={W} height={H} fill="#d9e8ca"/>
    <path d="M550 18 1086 300 550 742 14 460Z" fill="#789e66" opacity=".16"/>
    <path d="M550 32 1065 305 550 724 35 451Z" fill="url(#grass)" stroke="#6d975c" strokeWidth="4"/>
    {/* meandering stone lane */}
    <path d="M226 458 C330 457 376 542 485 532 S644 415 769 421 895 480 979 452" fill="none" stroke="#c9b99a" strokeWidth="58" strokeLinecap="round"/>
    <path d="M226 458 C330 457 376 542 485 532 S644 415 769 421 895 480 979 452" fill="none" stroke="#dfd1b1" strokeWidth="44" strokeLinecap="round" strokeDasharray="2 18"/>
    {/* garden plots */}
    <g {...pick('garden')}>
      <ellipse cx="788" cy="263" rx="102" ry="58" fill="#697d4d" opacity=".18"/>
      <path d="M700 248 794 200 883 248 788 300Z" fill="#865f45" stroke="#f4dfb4" strokeWidth="6"/>
      <path d="M711 248 794 206 871 248 788 292Z" fill="#9c704b"/>
      <path d="M721 247 789 214 858 248M741 261 803 229 846 250M758 275 817 245" fill="none" stroke="#6f8f4b" strokeWidth="6" strokeLinecap="round"/>
      {[0,1,2,3,4,5].map((i)=><g key={i}><path d={`M${746+i*19} ${238+(i%2)*8} q-5 -15 -2 -21 q9 10 4 21`} fill="#74a35a"/><circle cx={744+i*19} cy={215+(i%2)*6} r="4" fill="#f4c56c"/></g>)}
      <path d="M700 248 788 300 883 248" fill="none" stroke="#e5c690" strokeWidth="4"/>
    </g>
    {/* cottage */}
    <g {...pick('home')}>
      <ellipse cx="383" cy="287" rx="99" ry="39" fill="#526d48" opacity=".2"/>
      <path d="M301 229 386 185 471 229 471 300 386 345 301 300Z" fill="#f3dfb8" stroke="#b98662" strokeWidth="3"/>
      <path d="M301 229 386 274 471 229 386 185Z" fill="url(#roof)" stroke="#a34e43" strokeWidth="4"/>
      <path d="M386 274v71M301 229v71l85 45" fill="none" stroke="#d6b17d" strokeWidth="3"/>
      <path d="M361 215 386 168 415 214 386 231Z" fill="#e9d6ae" stroke="#a34e43" strokeWidth="4"/>
      <path d="M369 211 386 176 405 211 386 221Z" fill="#a94f45"/>
      <rect x="326" y="247" width="22" height="26" rx="10" fill="#8fc6c2" stroke="#fff1cf" strokeWidth="4"/><rect x="423" y="245" width="21" height="25" rx="10" fill="#8fc6c2" stroke="#fff1cf" strokeWidth="4"/>
      <path d="M376 292v-34q10-12 21 0v45l-21-11" fill="#9d674b" stroke="#84533d" strokeWidth="3"/><circle cx="391" cy="277" r="2" fill="#ffe4a0"/>
      <path d="m292 229 94-53 94 53" fill="none" stroke="#f1be85" strokeWidth="7" strokeLinecap="round"/>
      <text x="386" y="358" textAnchor="middle" className="scene-label">CASA DE LA JEFA</text>
    </g>
    {/* chicken coop */}
    <g {...pick('coop')}>
      <ellipse cx="612" cy="352" rx="104" ry="41" fill="#526d48" opacity=".2"/>
      <path d="M523 291 613 246 704 291 704 359 613 405 523 359Z" fill="#f1d8a9" stroke="#b78257" strokeWidth="3"/>
      <path d="M523 291 613 337 704 291 613 246Z" fill="url(#roof)" stroke="#a34e43" strokeWidth="4"/>
      <path d="M613 337v68M523 291v68l90 46" fill="none" stroke="#d3a36e" strokeWidth="3"/>
      <path d="M580 270 613 226 648 269 613 286Z" fill="#b85749" stroke="#913f39" strokeWidth="4"/>
      <path d="M584 356q29-28 58 0v36q-28 18-58 0Z" fill="#805b48" stroke="#674536" strokeWidth="3"/><path d="M585 356q28 20 57 0" fill="none" stroke="#f1d9aa" strokeWidth="4"/>
      <rect x="542" y="302" width="18" height="22" rx="7" fill="#8fc6c2" stroke="#fff1cf" strokeWidth="3"/><rect x="665" y="302" width="18" height="22" rx="7" fill="#8fc6c2" stroke="#fff1cf" strokeWidth="3"/>
      <text x="613" y="420" textAnchor="middle" className="scene-label">GALLINERO</text>
    </g>
    {/* barn */}
    <g {...pick('barn')}>
      <ellipse cx="865" cy="376" rx="88" ry="36" fill="#526d48" opacity=".18"/>
      <path d="M790 323 865 285 941 323 941 378 865 416 790 378Z" fill="#f0d4a5" stroke="#b78257" strokeWidth="3"/>
      <path d="M790 323 865 360 941 323 865 285Z" fill="#889e6b" stroke="#637c54" strokeWidth="4"/>
      <path d="M865 360v56M790 323v55l75 38" fill="none" stroke="#d3a36e" strokeWidth="3"/>
      <path d="M837 375q28-28 57 0v30l-57-1Z" fill="#a2754c" stroke="#79573e" strokeWidth="3"/><path d="M847 375v29m16-36v45m16-38v29" stroke="#f1d7aa" strokeWidth="4"/>
      <text x="865" y="432" textAnchor="middle" className="scene-label">ESTABLO</text>
    </g>
    {/* water well */}
    <g {...pick('well')}>
      <ellipse cx="491" cy="423" rx="47" ry="20" fill="#526d48" opacity=".2"/><path d="M462 395v29l29 15 30-15v-29" fill="#c3a578" stroke="#987951" strokeWidth="3"/><ellipse cx="491" cy="395" rx="30" ry="13" fill="#83b9c2" stroke="#987951" strokeWidth="4"/><path d="M459 391v-29m64 29v-29m-65 0 34-23 33 23" fill="none" stroke="#8a6349" strokeWidth="7" strokeLinecap="round"/><path d="M488 365v21" stroke="#8a6349" strokeWidth="4"/><text x="491" y="458" textAnchor="middle" className="scene-label">POZO</text>
    </g>
    {/* orchard trees */}
    {[[205,263,1],[247,332,.77],[321,403,.72],[950,239,.9],[1000,322,.68],[712,480,.8],[401,504,.65]].map(([x,y,s],i)=><g key={i} transform={`translate(${x} ${y}) scale(${s})`} className="sway"><ellipse cy="12" rx="37" ry="12" fill="#586d49" opacity=".2"/><path d="M-5 4v-42h15V6" fill="#96674b"/><circle cy="-46" r="31" fill={i%2?'#6f9d62':'#78a665'}/><circle cx="-19" cy="-34" r="18" fill="#8eb976"/><circle cx="19" cy="-35" r="20" fill="#679258"/><circle cx="-9" cy="-55" r="5" fill="#f1c869"/><circle cx="13" cy="-38" r="4" fill="#e58d6e"/></g>)}
    {/* flowers and fenced pasture */}
    <path d="M736 371 858 433 803 473 681 411Z" fill="#8bb870" stroke="#e4d2ae" strokeWidth="4"/>
    {Array.from({length:10},(_,i)=><g key={i}><circle cx={697+i*15} cy={408+(i%2)*15} r="3" fill={i%2?'#f5c869':'#f5eee0'}/></g>)}
    <g {...pick('sign')}><path d="M243 458v-45m34 61v-45" stroke="#79593f" strokeWidth="6"/><path d="m232 419 29-15 28 15-28 15Z" fill="#e7ba70" stroke="#79593f" strokeWidth="3"/><text x="261" y="422" textAnchor="middle" className="sign-text">GRANJA POLLITO</text></g>
    {/* coop fence */}
    <path d="M520 376 538 385m2-1v-25m27 40v-26m27 41v-25m27 41v-24m27 8 19-10" fill="none" stroke="#efe0bd" strokeWidth="6" strokeLinecap="round"/>
    {/* characters */}
    <g {...pick('pio', `animal ${workingCharacter === 'pio'?'working':''}`)} transform={workingCharacter === 'pio'?'translate(579 379)':'translate(682 465)'}>
      <ellipse cy="17" rx="21" ry="7" fill="#536348" opacity=".22"/><ellipse cy="0" rx="16" ry="13" fill="#f6d878"/><circle cx="11" cy="-15" r="11" fill="#ffe28a"/><path d="M5-25q5-12 10-2 8-7 9 2" fill="#dc7761"/><path d="m20-15 10 4-10 4" fill="#e69b54"/><circle cx="14" cy="-17" r="1.7" fill="#4c4a3f"/><path d="m-15 2-7 5 11 1" fill="#e6a04e"/><path d="m-5 11-2 7m12-7 2 7" stroke="#ad7642" strokeWidth="2.5"/>
    </g>
    <g {...pick('lola', `animal ${workingCharacter === 'lola'?'working':''}`)} transform={workingCharacter === 'lola'?'translate(579 392)':'translate(734 403)'}><ellipse cy="15" rx="17" ry="6" fill="#536348" opacity=".2"/><ellipse cy="0" rx="13" ry="10" fill="#f1c868"/><circle cx="9" cy="-12" r="9" fill="#ffe28a"/><path d="M5-20q4-9 8-1 6-6 7 2" fill="#d9685c"/><path d="m17-12 8 3-8 3" fill="#e69b54"/><circle cx="11" cy="-14" r="1.5" fill="#4c4a3f"/><path d="m-11 1-7 4 8 1" fill="#e6a04e"/></g>
    <g {...pick('margarita', `animal cow ${workingCharacter === 'margarita'?'working':''}`)} transform={workingCharacter === 'margarita'?'translate(811 332)':'translate(899 414)'}><ellipse cy="15" rx="27" ry="8" fill="#536348" opacity=".2"/><path d="M-24-7q12-13 37-5l10 11-7 12h-42l-5-10Z" fill="#f3eee0" stroke="#b9a984" strokeWidth="2"/><path d="M-14-8q8-7 13 0l-4 10h-10Zm21 4 9-4 7 8-4 8H9Z" fill="#766d68"/><circle cx="24" cy="-6" r="10" fill="#f6e9d2" stroke="#b9a984" strokeWidth="2"/><path d="m18-14-7-6 2 10m17-3 7-7-3 11" fill="#d7b3a5" stroke="#b9a984" strokeWidth="2"/><ellipse cx="29" cy="-3" rx="4" ry="3" fill="#df9c86"/><circle cx="27" cy="-8" r="1.3" fill="#4c4a3f"/><path d="m-16 9v10m10-10v10m16-10v10m8-10v10" stroke="#8c7c69" strokeWidth="3"/></g>
    {/* butterflies */}
    <g className="butterfly" transform="translate(947 265)"><path d="M0 0q-17-18-11 0Q-4 6 0 0 7-18 12-3 10 5 0 0" fill="#f0ad75"/><path d="M0-2v10" stroke="#775d4d" strokeWidth="2"/></g>
  </svg>;
}
