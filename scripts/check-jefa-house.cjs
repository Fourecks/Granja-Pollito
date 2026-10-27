const assert=require('node:assert/strict'),Module=require('node:module'),path=require('node:path'),fs=require('node:fs');
const {buildSync}=require('esbuild');
function load(entry){const code=buildSync({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text;const m=new Module(path.resolve(entry));m.paths=module.paths;m._compile(code,entry);return m.exports;}
const {jefaHousePlan}=load('src/game/world/jefaHousePlan.ts');const {navigation}=load('src/game/world/collisions.ts');const {NavigationGrid}=load('src/game/navigation.ts');
const {createVegetationPlan}=load('src/game/world/vegetationPlan.ts');
assert.equal(jefaHousePlan.id,'jefa-house');assert.equal(jefaHousePlan.obstacles.length,10);
const vegetation=createVegetationPlan(),nav=new NavigationGrid({...navigation,obstacles:[...navigation.obstacles,...vegetation.obstacles]},7);
assert(nav.canWalk(...jefaHousePlan.door),'The front door stays accessible.');
assert(nav.canWalk(...jefaHousePlan.approach),'The front path stays walkable.');
assert(!nav.canWalk(1672,1110),'Solid house wall blocks actors.');
assert(!nav.canWalk(1632,1140),'Side fence blocks actors without closing the garden.');
assert(nav.path([1426,972],jefaHousePlan.door).length,'The house connects to the plaza paths.');
const png=fs.readFileSync('public/assets/jefa-house-v1.png');assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(png.readUInt32BE(16),128);assert.equal(png.readUInt32BE(20),128);assert.equal(png[25],6,'The house sprite retains transparency.');
console.log('OK: jefa-house pixel-art asset, walkable front door, reachable entrance and solid walls/fences.');
