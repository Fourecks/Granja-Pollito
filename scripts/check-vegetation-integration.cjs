const assert=require('node:assert/strict'),Module=require('node:module'),path=require('node:path');
const {buildSync}=require('esbuild');
function load(entry){const code=buildSync({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text;const m=new Module(path.resolve(entry));m.paths=module.paths;m._compile(code,entry);return m.exports;}
const {createVegetationPlan}=load('src/game/world/vegetationPlan.ts');
const {resolveVegetationOccupancy,overlaps}=load('src/game/world/vegetationOccupancy.ts');
const atlas=require('../public/assets/vegetation-atlas.json');
const plan=createVegetationPlan(),snapshot=JSON.stringify(plan),visual=resolveVegetationOccupancy(plan);
assert.equal(JSON.stringify(plan),snapshot,'The physical plan must not change');assert.equal(plan.obstacles.length,361);
for(const p of visual.plants){const f=atlas.frames[p.name].frame;assert(Math.abs(p.drawWidth/p.height-f.w/f.h)<1e-9,`Aspect ratio: ${p.name}`);}
for(let i=0;i<visual.occupied.length;i++)for(let j=i+1;j<visual.occupied.length;j++)assert(!overlaps(visual.occupied[i],visual.occupied[j]),'Structural footprints overlap');
assert(visual.plants.some(p=>p.name==='SWING_TREE'),'Swing landmark retained');
console.log(`OK: ${visual.plants.length} native-aspect plants, unchanged physical plan, ${visual.occupied.length} non-overlapping footprints, swing retained.`);
