const assert=require('node:assert/strict'),Module=require('node:module'),path=require('node:path'),fs=require('node:fs');
const {buildSync}=require('esbuild');
function load(entry){const code=buildSync({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text;const m=new Module(path.resolve(entry));m.paths=module.paths;m._compile(code,entry);return m.exports;}
const {bridgePlans,bridgePoint}=load('src/game/world/bridgePlan.ts');const {NavigationGrid,inside}=load('src/game/navigation.ts');const {navigation}=load('src/game/world/collisions.ts');const {createVegetationPlan}=load('src/game/world/vegetationPlan.ts');const {waterfalls}=load('src/game/world/mapConfig.ts');
assert.deepEqual(new Set(bridgePlans.map(p=>p.style)),new Set(['rustic','rope','stone','footwalk']));
const plan=createVegetationPlan(),nav=new NavigationGrid({...navigation,obstacles:[...navigation.obstacles,...plan.obstacles]},7);
for(const p of bridgePlans){assert(p.width>=18-1e-8&&p.width<=36+1e-8);const route=nav.path(p.crossing.from,p.crossing.to);assert(route.length,`${p.crossing.id} remains connected`);
 for(let n=0;n<=20;n++){const v=bridgePoint(p,p.length*n/20,0);assert(nav.canWalk(v.x,v.y),`Deck center: ${p.crossing.id}`);}
 const mid=bridgePoint(p,p.length*.5,0);assert(inside([mid.x,mid.y],p.crossing.shape));
}
let forbidden=0;for(let y=0;y<2048;y+=14)for(let x=0;x<3072;x+=14){if(navigation.water.some(p=>inside([x,y],p))&&!navigation.waterIslands.some(p=>inside([x,y],p))&&!navigation.bridges.some(p=>inside([x,y],p))&&!navigation.passages.some(p=>inside([x,y],p))){assert(!nav.canWalk(x,y),'Land actors must not use water as shortcuts');forbidden++;}}
for(const [kind,count] of [['medium',6],['small',6]]){const atlas=JSON.parse(fs.readFileSync(`public/assets/waterfall-${kind}-v2.json`));assert.equal(Object.keys(atlas.frames).length,count);const first=atlas.frames['0'].frame;for(const f of Object.values(atlas.frames)){assert.equal(f.frame.w,first.w);assert.equal(f.frame.h,first.h);}}
assert.equal(waterfalls.length,5);console.log(`OK: four bridge styles, all ten authored bridges crossable, ${forbidden} water samples forbidden, fixed-size 6/6-frame waterfall atlases.`);
