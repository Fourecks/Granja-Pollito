const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const output=fs.mkdtempSync(path.join(os.tmpdir(),'granja-foundation-'));
try {
 execFileSync('./node_modules/.bin/tsc',['--target','es2022','--module','commonjs','--outDir',output,'--skipLibCheck','--esModuleInterop','src/game/navigation.ts','src/game/world/mapConfig.ts','src/game/world/zones.ts','src/game/world/collisions.ts','src/game/world/vegetationPlan.ts','src/game/world/tulipFieldPlan.ts','src/game/world/wind.ts','src/data/routes.ts','src/data/interiors.ts','src/data/celebration.ts','src/domain.ts','src/game/effects/particles.ts']);
 const {NavigationGrid,inside,rectangle}=require(path.join(output,'game/navigation.js'));
 const {navigation,navigationFor}=require(path.join(output,'game/world/collisions.js'));
 const {zones,zoneById}=require(path.join(output,'game/world/zones.js'));
 const {plazaAccess}=require(path.join(output,'game/world/plazaPlan.js'));
 const zoneAccess=z=>['greenhouseArea','centralPlaza'].includes(z.id)?z.approach:z.center;
 const {roads,bridges,ramps,cliffFaces,MAP,point}=require(path.join(output,'game/world/mapConfig.js'));
 const {workers,taskRoutes}=require(path.join(output,'data/routes.js'));
 const {interiors}=require(path.join(output,'data/interiors.js'));
 const {gatheringPoints,celebrationHumans}=require(path.join(output,'data/celebration.js'));
 const {DEFAULT_STATE,runOfflineProgress,performTask}=require(path.join(output,'domain.js'));
 const {createVegetationPlan,footprint,waterAt}=require(path.join(output,'game/world/vegetationPlan.js'));
 const plan=createVegetationPlan();assert.deepEqual(plan,createVegetationPlan(),'Distribución determinista');
 assert.ok(plan.plants.length>2500,'Densidad natural');
 assert.ok(plan.plants.filter(p=>p.biome==='panda').length>100,'Hábitat panda');
 assert.ok(plan.plants.filter(p=>p.biome==='north').length>200,'Bosque Norte');
 assert.equal(plan.plants.filter(p=>p.biome==='landmark').length,10,'Landmarks conservados');
 assert.ok(plan.plants.some(p=>p.name==='REEDS_01'&&waterAt(p.x,p.y)),'Juncos parcialmente en agua');
 for(const p of plan.plants){if(p.solid)assert.ok(plan.obstacles.some(o=>inside([p.x,p.y],o)));for(const z of zones.filter(z=>['centralPlaza','cropsArea','jefeHouseArea','cowArea','chickenArea','mixedBarnArea','greenhouseArea','rabbitArea','sheepGoatArea'].includes(z.id)))assert.equal(inside([p.x,p.y],z.shape),false,'Parcela reservada '+z.id);}
 const {createTulipFieldPlan,distanceToPath,fieldGround}=require(path.join(output,'game/world/tulipFieldPlan.js'));
 const foundationNav=new NavigationGrid({...navigation,obstacles:[...navigation.obstacles,...plan.obstacles]},7);
 const garden=createTulipFieldPlan(plan,foundationNav);
 const nav=garden.nav;
 assert.ok(garden.flowers.length>1100,'Campo grande');
 for(const f of garden.flowers){assert.ok(fieldGround(f.x,f.y),'Tulipanes fuera de parcelas/agua');assert.ok(distanceToPath(f.x,f.y,garden.path)>=19,'Sendero del campo despejado');}
 const bench=garden.props.find(p=>p.key==='BENCH'),tree=garden.props.find(p=>p.key==='TREE_BLOSSOM_PINK'),arch=garden.props.find(p=>p.key==='ARCH');
 assert.equal(nav.canWalk(...bench.position),false,'Banca sólida');assert.equal(nav.canWalk(...tree.position),false,'Tronco del cerezo sólido');assert.equal(nav.canWalk(...arch.position),true,'Paso bajo arco');
 assert.ok(nav.segment([arch.position[0],arch.position[1]-18],[arch.position[0],arch.position[1]+18]),'Cruzar bajo arco');
 assert.ok(garden.flowers.some(f=>nav.canWalk(f.x,f.y)),'Tulipanes transitables');
 for(let i=1;i<garden.path.length;i++)assert.ok(nav.segment(garden.path[i-1],garden.path[i]),'Sendero del campo transitable');
 const {WindSystem}=require(path.join(output,'game/world/wind.js')),wind=new WindSystem(),variation=wind.variation(200,300);wind.strength=0;assert.equal(wind.response('tulips',4000,variation),0,'Viento quieto');wind.strength=.5;assert.notEqual(wind.response('tulips',4000,variation),wind.response('tulips',4000,wind.variation(400,300)),'Desfase espacial de viento');
 const trunk=plan.plants.find(p=>p.name==='TREE_GREEN_01');assert.ok(trunk);assert.equal(nav.canWalk(trunk.x,trunk.y),false,'Tronco bloqueado');assert.ok(trunk.height>80);assert.ok(Math.max(...footprint(trunk).map(p=>p[0]))-Math.min(...footprint(trunk).map(p=>p[0]))<trunk.width*.3,'Colisión solo base');
 assert.ok(plan.plants.some(p=>p.ground&&p.name.startsWith('FLOWERS_')&&nav.canWalk(p.x,p.y)),'Flores transitables');
 console.log(`Vegetación: ${plan.plants.length} instancias, ${plan.obstacles.length} bases sólidas, parcelas libres.`);let routes=0,samples=0;
 function check(start,goal,label,grid=nav){
  assert.ok(grid.canWalk(...start),'Inicio bloqueado: '+label+': '+start);assert.ok(grid.canWalk(...goal),'Destino bloqueado: '+label+': '+goal);
  const route=grid.path(start,goal);assert.ok(route.length,'Sin ruta: '+label);let prior=start;
  for(const p of route){assert.ok(grid.segment(prior,p),'Segmento bloqueado: '+label);const steps=Math.ceil(Math.hypot(p[0]-prior[0],p[1]-prior[1])/4);for(let i=0;i<=steps;i++){const t=steps?i/steps:0;assert.ok(grid.canWalk(prior[0]+(p[0]-prior[0])*t,prior[1]+(p[1]-prior[1])*t),'Muestra bloqueada: '+label);samples++;}prior=p;}routes++;
 }
 const badRoads=[];
 for(const road of roads){for(let i=1;i<road.line.length;i++)if(!nav.segment(road.line[i-1],road.line[i])){badRoads.push({id:road.id,at:road.line[i].map(v=>Math.round(v/2))});break;}}
 assert.deepEqual(badRoads,[],'Senderos dibujados bloqueados');
 // Verify the authored road graph independently of A*: free grass cannot hide a missing link.
 const graph=Array.from({length:roads.length+zones.length},()=>new Set());
 const link=(a,b)=>{graph[a].add(b);graph[b].add(a);};
 const projection=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));return [a[0]+dx*t,a[1]+dy*t];};
 function closest(a,b,c,d){
  const dx=b[0]-a[0],dy=b[1]-a[1],ex=d[0]-c[0],ey=d[1]-c[1],den=dx*ey-dy*ex;
  if(Math.abs(den)>1e-7){const t=((c[0]-a[0])*ey-(c[1]-a[1])*ex)/den,u=((c[0]-a[0])*dy-(c[1]-a[1])*dx)/den;if(t>=0&&t<=1&&u>=0&&u<=1){const p=[a[0]+dx*t,a[1]+dy*t];return [p,p];}}
  return [[a,projection(a,c,d)],[b,projection(b,c,d)],[projection(c,a,b),c],[projection(d,a,b),d]].sort(([p,q],[r,s])=>Math.hypot(p[0]-q[0],p[1]-q[1])-Math.hypot(r[0]-s[0],r[1]-s[1]))[0];
 }
 for(let a=0;a<roads.length;a++)for(let b=a+1;b<roads.length;b++){
  const first=roads[a],second=roads[b],clearance=(first.width+second.width)/2-2*nav.radius;
  outer:for(let i=1;i<first.line.length;i++)for(let j=1;j<second.line.length;j++){const [p,q]=closest(first.line[i-1],first.line[i],second.line[j-1],second.line[j]);if(Math.hypot(p[0]-q[0],p[1]-q[1])<=clearance&&nav.segment(p,q)){link(a,b);break outer;}}
 }
 for(let z=0;z<zones.length;z++){
  for(let r=0;r<roads.length;r++){const road=roads[r],candidates=[...road.line,...road.line.slice(1).map((p,i)=>projection(zoneAccess(zones[z]),road.line[i],p))];if(candidates.some(p=>inside(p,zones[z].shape)&&nav.segment(zoneAccess(zones[z]),p)))link(roads.length+z,r);}
  for(let other=0;other<z;other++)if((inside(zones[z].center,zones[other].shape)||inside(zones[other].center,zones[z].shape))&&nav.segment(zoneAccess(zones[z]),zoneAccess(zones[other])))link(roads.length+z,roads.length+other);
 }
 const connected=new Set([roads.length+zones.findIndex(z=>z.id==='centralPlaza')]),queue=[...connected];
 for(const node of queue)for(const next of graph[node])if(!connected.has(next)){connected.add(next);queue.push(next);}
 assert.deepEqual(zones.filter((_,i)=>!connected.has(roads.length+i)).map(z=>z.id),[],'Sectores sin camino hacia Plaza Central');
 assert.deepEqual(roads.filter((_,i)=>!connected.has(i)).map(r=>r.id),[],'Senderos aislados');
 for(const z of zones)check(plazaAccess,zoneAccess(z),'plaza → '+z.id);
 check(plazaAccess,garden.rest,'plaza → Campo de Tulipanes');
 for(const p of [...gatheringPoints,...Object.values(celebrationHumans)])check(plazaAccess,p,'sorpresa existente');
 for(const worker of workers){for(const [id,task] of Object.entries(taskRoutes)){check(worker.home,task.point,worker.id+' → '+id);check(task.point,worker.home,id+' → regreso');}for(const p of worker.path)check(worker.home,p,worker.id+' patrulla');}
 for(const b of [...bridges,...ramps])check(b.from,b.to,'cruce '+b.id);
 // Closed water and cliffs, including world limits. Test a bridge's actual crossing of water.
 assert.equal(nav.canWalk(...point(340,690)),false,'Lago bloqueado');assert.equal(nav.canWalk(...point(1080,970)),false,'Mar bloqueado');
 assert.equal(nav.canWalk(...point(780,255)),false,'Río bloqueado');assert.equal(nav.canWalk(...point(850,690)),false,'Acantilado bloqueado');
 assert.equal(nav.canWalk(-1,100),false);assert.equal(nav.canWalk(MAP.width,100),false);
 const b=bridges.find(b=>b.id==='plaza-bridge'),mid=[(b.from[0]+b.to[0])/2,(b.from[1]+b.to[1])/2];
 assert.equal(nav.canWalk(...mid),true);const noBridge=new NavigationGrid({...navigation,bridges:[]},7);assert.equal(noBridge.canWalk(...mid),false,'Agua vuelve a bloquear sin puente');
 for(const bridge of bridges.filter(b=>b.kind==='bridge')){assert.ok(noBridge.canWalk(...bridge.from)&&noBridge.canWalk(...bridge.to),'Orillas secas del puente '+bridge.id);assert.ok(Array.from({length:21},(_,i)=>[bridge.from[0]+(bridge.to[0]-bridge.from[0])*i/20,bridge.from[1]+(bridge.to[1]-bridge.from[1])*i/20]).some(p=>navigation.water.some(w=>inside(p,w))&&!navigation.waterIslands.some(w=>inside(p,w))),'Puente con cruce real de agua '+bridge.id);}
 const blocked=new NavigationGrid({...navigation,obstacles:[...cliffFaces,rectangle(mid[0]-12,mid[1]-12,24,24)]},7);assert.equal(blocked.canWalk(...mid),false,'Objeto futuro bloquea puente');
 const swim=new NavigationGrid(navigationFor(['LAND','WATER']),7);assert.equal(swim.canWalk(...point(340,690)),true,'Capacidad acuática futura');
 for(const task of Object.values(taskRoutes)){const room=interiors[task.room],grid=new NavigationGrid({width:1672,height:941,walkable:room.walkable,obstacles:room.obstacles},7);check([830,560],task.interiorPoint,'interior preservado',grid);}
 const state=structuredClone(DEFAULT_STATE),now=Date.now();state.lastSeen=now-24*3600000;state.tasks['collect-milk'].assignedTo='vera';state.tasks['collect-eggs'].assignedTo='alma';const progress=runOfflineProgress(state,now);
 assert.equal(progress.state.milk,16);assert.equal(progress.state.eggs,32);assert.equal(state.milk,0);assert.equal(performTask(state,'collect-eggs').eggs,4);assert.equal(performTask(state,'water-crops').cropsWatered,true);
 const {ParticleEngine}=require(path.join(output,'game/effects/particles.js'));const engine=new ParticleEngine(650,()=>.5);engine.burst(10,20,'burst',0xffd277,1000);assert.equal(engine.particles.length,650);engine.reset();assert.equal(engine.particles.length,0);
 console.log(`OK: ${routes} rutas, ${samples} muestras; ${roads.length} caminos y ${zones.length} parcelas conectados, tareas, puentes/rampas, agua/acantilados, capacidad acuática, interiores, progreso offline y celebración preservados.`);
}finally{fs.rmSync(output,{recursive:true,force:true});}
