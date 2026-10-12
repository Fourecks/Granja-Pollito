const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'granja-pollito-world-'));
try {
 execFileSync('./node_modules/.bin/tsc', ['--target','es2022','--module','commonjs','--outDir',output,'--skipLibCheck','--esModuleInterop','src/game/navigation.ts','src/data/world.ts','src/data/routes.ts','src/data/interiors.ts','src/data/farm.ts','src/domain.ts','src/data/celebration.ts','src/game/effects/particles.ts']);
 const {NavigationGrid,inside,rectangle}=require(path.join(output,'game/navigation.js'));
 const {navigation,waterZones,bridge,coopPen,cowPen}=require(path.join(output,'data/world.js'));
 const {workers,taskRoutes}=require(path.join(output,'data/routes.js'));
 const {characters}=require(path.join(output,'data/farm.js'));
 const {interiors}=require(path.join(output,'data/interiors.js'));
 const {DEFAULT_STATE,performTask,runOfflineProgress}=require(path.join(output,'domain.js'));
 const {celebrationEntities,celebrationHumans,globalDestinations,gatheringPoints}=require(path.join(output,'data/celebration.js'));
 const eventNavigation={...navigation,obstacles:[...navigation.obstacles,...celebrationEntities.filter(e=>e.collision).map(e=>e.collision.map(([x,y])=>[x+e.position[0],y+e.position[1]]))]};
 const nav=new NavigationGrid(eventNavigation,4),chicks=new NavigationGrid({...navigation,walkable:[coopPen]},2),cows=new NavigationGrid({...navigation,walkable:[cowPen]},7);
 let routes=0,samples=0;
 function checkRoute(grid,start,goal,label){
  const route=grid.path(start,goal);assert.ok(route.length,`Sin ruta: ${label}`);let prior=start;
  for(const point of route){assert.ok(grid.segment(prior,point),`Segmento bloqueado: ${label}`);const steps=Math.max(1,Math.ceil(Math.hypot(point[0]-prior[0],point[1]-prior[1])/2));
   for(let i=0;i<=steps;i++){const p=[prior[0]+(point[0]-prior[0])*i/steps,prior[1]+(point[1]-prior[1])*i/steps];assert.ok(grid.canWalk(...p),`Blocked sample ${label}: ${p}`);if(grid===nav||grid===chicks||grid===cows)assert.ok(!waterZones.some(w=>inside(p,w))||inside(p,bridge),`Agua sin puente: ${label}`);samples++;}prior=point;
  }routes++;
 }
 for(const[id,task]of Object.entries(taskRoutes)){
  // Every worker can be assigned any task; verify all 18 combinations, including return routes.
  for(const worker of workers){checkRoute(nav,worker.home,task.point,worker.id+':'+id);checkRoute(nav,task.point,worker.home,id+':return');}
  const room=interiors[task.room],grid=new NavigationGrid({width:1672,height:941,walkable:room.walkable,obstacles:room.obstacles},7);
  checkRoute(grid,[830,560],task.interiorPoint,'interior:'+id);
 }
 for(const actor of characters){const grid=actor.kind==='cow'?cows:actor.zone==='estanque'?nav:chicks;const p=[actor.position.x,actor.position.y];assert.ok(grid.canWalk(...p),'Spawn bloqueado: '+actor.id);let previous=p;for(const point of actor.path){checkRoute(grid,previous,point,actor.id);previous=point;}}
 checkRoute(nav,[1290,445],[1535,508],'bridge');
 assert.equal(new NavigationGrid(navigation,4).canWalk(908,360),true);assert.equal(nav.canWalk(908,360),false);
 assert.equal(nav.path([710,390],[1350,650]).length,0);assert.equal(chicks.path([280,350],[1285,298]).length,0);assert.equal(cows.path([1285,298],[280,350]).length,0);
 for(const p of [[1350,650],[1620,370],[1270,660]]){assert.equal(nav.canWalk(...p),false);assert.equal(chicks.canWalk(...p),false);assert.equal(cows.canWalk(...p),false);}
 for(const e of celebrationEntities.filter(e=>e.collision))assert.equal(nav.canWalk(...e.position),false,'Objeto sólido: '+e.id);
 for(const [id,p] of Object.entries(celebrationHumans)){checkRoute(nav,workers.find(w=>w.id===id).home,p,'human:'+id);for(const [task,route] of Object.entries(taskRoutes)){checkRoute(nav,p,route.point,'plaza-task:'+id+':'+task);checkRoute(nav,route.point,p,'plaza-return:'+id+':'+task);}}
 for(const destination of globalDestinations)for(const worker of workers)checkRoute(nav,worker.home,destination,'global:'+worker.id+':'+destination);
 assert.deepEqual(gatheringPoints.filter(p=>!nav.canWalk(...p)),[],'Puntos bloqueados');
 for(const p of gatheringPoints){assert.ok(nav.canWalk(...p),'Reunión bloqueada: '+p);checkRoute(nav,[718,439],p,'reunión');}
 const bridgeBlocked=new NavigationGrid({...navigation,obstacles:[...navigation.obstacles,rectangle(1460,480,12,12)]},2);assert.equal(bridgeBlocked.canWalk(1466,486),false);
 const state=structuredClone(DEFAULT_STATE),now=Date.now();state.lastSeen=now-24*3600000;state.tasks['collect-milk'].assignedTo='vera';state.tasks['collect-eggs'].assignedTo='alma';
 const result=runOfflineProgress(state,now);assert.equal(result.state.milk,16);assert.equal(result.state.eggs,32);assert.ok(result.report.lines.some(s=>s.startsWith('Kiara')));assert.equal(state.milk,0);assert.equal(performTask(state,'collect-eggs').eggs,4);assert.equal(performTask(state,'water-crops').cropsWatered,true);
 const {ParticleEngine}=require(path.join(output,'game/effects/particles.js'));const engine=new ParticleEngine(650,()=>.5);
 for(const kind of ['burst','willow','chrysanthemum','heart','sparkles'])engine.burst(805,200,kind,0xffd277,100);
 assert.equal(engine.particles.length,500);for(let i=0;i<240;i++)engine.update(1/60);assert.equal(engine.particles.length,0);
 engine.text([[1,2],[40,20]],[800,350]);for(let i=0;i<180;i++)engine.update(1/60);assert.ok(Math.abs(engine.particles[0].x-1)<.5);assert.ok(Math.abs(engine.particles[0].y-2)<.5);
 engine.burst(10,20,'burst',0xffd277,1000);assert.equal(engine.particles.length,650);engine.reset();assert.equal(engine.particles.length,0);
 console.log(`OK: ${routes} rutas, ${samples} puntos transitables, agua/puente, corrales, interiores y progreso offline y partículas (límite, física, texto y reinicio).`);
} finally {fs.rmSync(output,{recursive:true,force:true});}
