const assert=require('node:assert/strict'),Module=require('node:module'),path=require('node:path');
const {buildSync}=require('esbuild');
function load(entry){const code=buildSync({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text;const m=new Module(path.resolve(entry));m.paths=module.paths;m._compile(code,entry);return m.exports;}
const {createVegetationPlan}=load('src/game/world/vegetationPlan.ts');
const {resolveVegetationOccupancy}=load('src/game/world/vegetationOccupancy.ts');
const {NATURAL_HEIGHTS}=load('src/game/world/naturalScale.ts');
const {WaterHabitat,isTallReed}=load('src/game/world/waterHabitat.ts');
const plan=createVegetationPlan(),original=JSON.stringify(plan),visual=resolveVegetationOccupancy(plan);
assert.equal(JSON.stringify(plan),original,'Canonical art must not modify navigation or the physical plan');
for(const p of visual.plants){const base=NATURAL_HEIGHTS[p.name];if(base)assert(p.height>=base*.9-1e-9&&p.height<=base*1.1+1e-9,`${p.name}: canonical category variance`);}
assert(visual.plants.filter(p=>p.name.startsWith('FRUIT_TREE')).every(p=>p.height>100),'Fruit trees must be adult models, not downscaled plants');
const width=1536,height=1024,n=width*height*4,masks=Object.fromEntries(['land','water','surfaces','paths','cliffs'].map(k=>[k,new Uint8ClampedArray(n)]));
for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4;masks.land[i+3]=255;if(x>=200&&x<240)masks.water[i+3]=255;}
const habitat=new WaterHabitat(masks),reed={name:'CATTAILS',x:440,y:1200,height:38,width:38,drawWidth:38,solid:false,ground:false,biome:'shore',sway:false},low={...reed,name:'WATER_GRASS'};
assert(habitat.depthAt(440,1200)>12,'Synthetic deep channel');
const placed=habitat.placeTallReeds([reed,low]);
const result=placed.plants.find(p=>isTallReed(p.name));assert(result&&habitat.green(result.x,result.y),'Tall reed roots must move onto the shore');
assert.strictEqual(placed.plants.find(p=>p.name==='WATER_GRASS'),low,'Low aquatic vegetation must remain untouched');
assert.equal(reed.x,440,'Visual relocation must not mutate its source');
console.log('OK: category scales within ±10%, adult fruit trees, immutable physical plan, dry-root tall reeds and preserved low water plants.');
