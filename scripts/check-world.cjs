const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const output=fs.mkdtempSync(path.join(os.tmpdir(),'granja-foundation-'));
try {
 execFileSync('./node_modules/.bin/tsc',['--target','es2022','--module','commonjs','--outDir',output,'--skipLibCheck','--esModuleInterop','src/game/navigation.ts','src/game/world/mapConfig.ts','src/game/world/zones.ts','src/game/world/collisions.ts','src/data/routes.ts','src/data/interiors.ts','src/data/celebration.ts','src/domain.ts','src/game/effects/particles.ts']);
 const {NavigationGrid,inside,rectangle}=require(path.join(output,'game/navigation.js'));
 const {navigation,navigationFor}=require(path.join(output,'game/world/collisions.js'));
 const {zones,zoneById}=require(path.join(output,'game/world/zones.js'));
 const {bridges,ramps,cliffFaces,MAP,point}=require(path.join(output,'game/world/mapConfig.js'));
 const {workers,taskRoutes}=require(path.join(output,'data/routes.js'));
 const {interiors}=require(path.join(output,'data/interiors.js'));
 const {gatheringPoints,celebrationHumans}=require(path.join(output,'data/celebration.js'));
 const {DEFAULT_STATE,runOfflineProgress,performTask}=require(path.join(output,'domain.js'));
 const nav=new NavigationGrid(navigation,7);let routes=0,samples=0;
 function check(start,goal,label,grid=nav){
  assert.ok(grid.canWalk(...start),'Inicio bloqueado: '+label+': '+start);assert.ok(grid.canWalk(...goal),'Destino bloqueado: '+label+': '+goal);
  const route=grid.path(start,goal);assert.ok(route.length,'Sin ruta: '+label);let prior=start;
  for(const p of route){assert.ok(grid.segment(prior,p),'Segmento bloqueado: '+label);const steps=Math.ceil(Math.hypot(p[0]-prior[0],p[1]-prior[1])/4);for(let i=0;i<=steps;i++){const t=steps?i/steps:0;assert.ok(grid.canWalk(prior[0]+(p[0]-prior[0])*t,prior[1]+(p[1]-prior[1])*t),'Muestra bloqueada: '+label);samples++;}prior=p;}routes++;
 }
 for(const z of zones)check(zoneById.centralPlaza.center,z.center,'plaza → '+z.id);
 for(const p of [...gatheringPoints,...Object.values(celebrationHumans)])check(zoneById.centralPlaza.center,p,'sorpresa existente');
 for(const worker of workers){for(const [id,task] of Object.entries(taskRoutes)){check(worker.home,task.point,worker.id+' → '+id);check(task.point,worker.home,id+' → regreso');}for(const p of worker.path)check(worker.home,p,worker.id+' patrulla');}
 for(const b of [...bridges,...ramps])check(b.from,b.to,'cruce '+b.id);
 // Closed water and cliffs, including world limits. Test a bridge's actual crossing of water.
 assert.equal(nav.canWalk(...point(340,690)),false,'Lago bloqueado');assert.equal(nav.canWalk(...point(1080,970)),false,'Mar bloqueado');
 assert.equal(nav.canWalk(...point(780,255)),false,'Río bloqueado');assert.equal(nav.canWalk(...point(850,690)),false,'Acantilado bloqueado');
 assert.equal(nav.canWalk(-1,100),false);assert.equal(nav.canWalk(MAP.width,100),false);
 const b=bridges.find(b=>b.id==='plaza-bridge'),mid=[(b.from[0]+b.to[0])/2,(b.from[1]+b.to[1])/2];
 assert.equal(nav.canWalk(...mid),true);const noBridge=new NavigationGrid({...navigation,bridges:[]},7);assert.equal(noBridge.canWalk(...mid),false,'Agua vuelve a bloquear sin puente');
 const blocked=new NavigationGrid({...navigation,obstacles:[...cliffFaces,rectangle(mid[0]-12,mid[1]-12,24,24)]},7);assert.equal(blocked.canWalk(...mid),false,'Objeto futuro bloquea puente');
 const swim=new NavigationGrid(navigationFor(['LAND','WATER']),7);assert.equal(swim.canWalk(...point(340,690)),true,'Capacidad acuática futura');
 for(const task of Object.values(taskRoutes)){const room=interiors[task.room],grid=new NavigationGrid({width:1672,height:941,walkable:room.walkable,obstacles:room.obstacles},7);check([830,560],task.interiorPoint,'interior preservado',grid);}
 const state=structuredClone(DEFAULT_STATE),now=Date.now();state.lastSeen=now-24*3600000;state.tasks['collect-milk'].assignedTo='vera';state.tasks['collect-eggs'].assignedTo='alma';const progress=runOfflineProgress(state,now);
 assert.equal(progress.state.milk,16);assert.equal(progress.state.eggs,32);assert.equal(state.milk,0);assert.equal(performTask(state,'collect-eggs').eggs,4);assert.equal(performTask(state,'water-crops').cropsWatered,true);
 const {ParticleEngine}=require(path.join(output,'game/effects/particles.js'));const engine=new ParticleEngine(650,()=>.5);engine.burst(10,20,'burst',0xffd277,1000);assert.equal(engine.particles.length,650);engine.reset();assert.equal(engine.particles.length,0);
 console.log(`OK: ${routes} rutas, ${samples} muestras; zonas conectadas, tareas, puentes/rampas, agua/acantilados, capacidad acuática, interiores, progreso offline y celebración preservados.`);
}finally{fs.rmSync(output,{recursive:true,force:true});}
