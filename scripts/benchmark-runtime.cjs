const {buildSync}=require('esbuild'),Module=require('node:module'),path=require('node:path'),{performance}=require('node:perf_hooks');
function load(entry){const m=new Module(path.resolve(entry));m.paths=module.paths;m._compile(buildSync({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text,entry);return m.exports;}
const {NavigationGrid}=load('src/game/navigation.ts'),{navigation}=load('src/game/world/collisions.ts'),{createVegetationPlan}=load('src/game/world/vegetationPlan.ts'),{LivestockSimulation}=load('src/game/world/livestock.ts');
const t=performance.now(),plan=createVegetationPlan(),nav=new NavigationGrid({...navigation,obstacles:[...navigation.obstacles,...plan.obstacles]},7),initMs=performance.now()-t;
const routes=[];for(const [name,start,end] of [['plaza-stable',[1380,990],[1094,610]],['plaza-cows',[1460,1000],[2140,676]],['plaza-goats',[1436,940],[318,1318]]]){const t=performance.now(),p=nav.path(start,end);routes.push({name,ms:+(performance.now()-t).toFixed(2),waypoints:p.length});}
const sim=new LivestockSimulation(nav.forGateAccess(false)),times=[];
for(let time=0;time<20000;time+=16){const t=performance.now();sim.update(time,16);times.push(performance.now()-t);}
times.sort((a,b)=>a-b);console.log(JSON.stringify({initMs:+initMs.toFixed(2),routes,livestock:{samples:times.length,totalMs:+times.reduce((a,b)=>a+b,0).toFixed(2),p95Ms:+times[Math.floor(times.length*.95)].toFixed(3),maxMs:+times.at(-1).toFixed(2)}},null,2));
