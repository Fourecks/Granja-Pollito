const assert=require('node:assert/strict'),Module=require('node:module'),path=require('node:path'),fs=require('node:fs');
const {buildSync}=require('esbuild');
function load(entry){const code=buildSync({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text;const m=new Module(path.resolve(entry));m.paths=module.paths;m._compile(code,entry);return m.exports;}
const {ruralBuildings,ruralBuildingObstacles}=load('src/game/world/ruralBuildings.ts');const {navigation}=load('src/game/world/collisions.ts');const {NavigationGrid}=load('src/game/navigation.ts');
const {createVegetationPlan}=load('src/game/world/vegetationPlan.ts');
const vegetation=createVegetationPlan(),nav=new NavigationGrid({...navigation,obstacles:[...navigation.obstacles,...vegetation.obstacles]},7);
assert.equal(ruralBuildings.length,10);assert.equal(new Set(ruralBuildings.map(b=>b.id)).size,10);
for(const b of ruralBuildings){
 assert(nav.canWalk(...b.door),b.id+' door accessible');
 assert(nav.path([1426,1050],b.door).length,b.id+' connected to plaza');
 assert(!nav.canWalk(...b.center),b.id+' solid foundation');
 const png=fs.readFileSync('public/assets/'+b.texture+'.png');assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(png[25],6,b.id+' alpha');
}
assert(ruralBuildings.find(b=>b.id==='jefa-house').texture==='jefa-house-v3','Old house replaced');
console.log('OK: ten rural buildings, clear doors, solid walls, open connections, transparent sprites and replaced house.');
