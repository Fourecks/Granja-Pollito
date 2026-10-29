const assert=require('node:assert/strict'),Module=require('node:module'),path=require('node:path');
const {buildSync}=require('esbuild');
function load(entry){const code=buildSync({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text;const m=new Module(path.resolve(entry));m.paths=module.paths;m._compile(code,entry);return m.exports;}
const {navigation}=load('src/game/world/collisions.ts'),{NavigationGrid}=load('src/game/navigation.ts');
const {createVegetationPlan}=load('src/game/world/vegetationPlan.ts'),{LivestockSimulation,livestockHabitats}=load('src/game/world/livestock.ts');
const {fountainCenter,plazaAccess,plazaBenches}=load('src/game/world/plazaPlan.ts');
const plan=createVegetationPlan(),nav=new NavigationGrid({...navigation,obstacles:[...navigation.obstacles,...plan.obstacles]},7).forGateAccess(false);
assert(!nav.canWalk(...fountainCenter),'Fountain must block walking');assert(nav.canWalk(...plazaAccess));
for(const p of plazaBenches)assert(!nav.canWalk(...p),'Bench collision');
assert(nav.path([1326,972],[1526,972]).length,'Route around fountain');
const sim=new LivestockSimulation(nav);assert.equal(sim.animals.length,29);assert.equal(livestockHabitats.length,6);
const states=new Map(sim.animals.map(a=>[a.id,new Set()]));let moving=0;
for(let time=0;time<120000;time+=80){sim.update(time,80);for(const a of sim.animals){
 const [x,y,r,b]=a.habitat.bounds;assert(a.x>=x&&a.x<=r&&a.y>=y&&a.y<=b,a.id+' habitat bounds');assert(nav.canWalk(a.x,a.y),a.id+' dry reachable ground');states.get(a.id).add(a.state);if(a.state==='walk')moving++;
}}
assert(moving>100,'Animals walk');for(const h of livestockHabitats)assert(sim.animals.filter(a=>a.habitat===h).some(a=>states.get(a.id).has('eat')),h.species+' eating');
console.log('OK: fountain and four benches solid; 29 animals / six species stay on dry ground within their habitats for two simulated minutes, walk and eat.');
