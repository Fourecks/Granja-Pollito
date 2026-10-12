const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'granja-pollito-world-'));
try {
 execFileSync('./node_modules/.bin/tsc', ['--target','es2022','--module','commonjs','--outDir',output,'--skipLibCheck','src/game/navigation.ts','src/data/world.ts','src/data/routes.ts','src/data/interiors.ts','src/data/farm.ts','src/domain.ts']);
 const {NavigationGrid,inside,rectangle}=require(path.join(output,'game/navigation.js'));
 const {navigation,waterZones,bridge,coopPen,cowPen}=require(path.join(output,'data/world.js'));
 const {workers,taskRoutes}=require(path.join(output,'data/routes.js'));
 const {characters}=require(path.join(output,'data/farm.js'));
 const {interiors}=require(path.join(output,'data/interiors.js'));
 const {DEFAULT_STATE,performTask,runOfflineProgress}=require(path.join(output,'domain.js'));
 const nav=new NavigationGrid(navigation,4),chicks=new NavigationGrid({...navigation,walkable:[coopPen]},2),cows=new NavigationGrid({...navigation,walkable:[cowPen]},7);
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
 assert.equal(nav.path([710,390],[1350,650]).length,0);assert.equal(chicks.path([280,350],[1285,298]).length,0);assert.equal(cows.path([1285,298],[280,350]).length,0);
 for(const p of [[1350,650],[1620,370],[1270,660]]){assert.equal(nav.canWalk(...p),false);assert.equal(chicks.canWalk(...p),false);assert.equal(cows.canWalk(...p),false);}
 const state=structuredClone(DEFAULT_STATE),now=Date.now();state.lastSeen=now-24*3600000;state.tasks['collect-milk'].assignedTo='vera';state.tasks['collect-eggs'].assignedTo='alma';
 const result=runOfflineProgress(state,now);assert.equal(result.state.milk,16);assert.equal(result.state.eggs,32);assert.ok(result.report.lines.some(s=>s.startsWith('Vera')));assert.equal(state.milk,0);assert.equal(performTask(state,'collect-eggs').eggs,4);assert.equal(performTask(state,'water-crops').cropsWatered,true);
 console.log(`OK: ${routes} rutas, ${samples} puntos transitables, agua/puente, corrales, interiores y progreso offline.`);
} finally {fs.rmSync(output,{recursive:true,force:true});}
